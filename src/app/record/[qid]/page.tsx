"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function RecordPage() {
  const { qid } = useParams<{ qid: string }>();
  const sp = useSearchParams();
  const router = useRouter();

  const sessionId = sp.get("sessionId")!;
  const name = sp.get("name") || "";
  const skill = sp.get("skill") || "Beginner";
  const timeLimit = Number(sp.get("time") || "90");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // control flags to avoid double-start/stop/upload
  const startedRef = useRef(false);
  const stoppingRef = useRef(false);
  const uploadInProgressRef = useRef(false);
  const countdownTimerRef = useRef<number | null>(null);
  const recordTimerRef = useRef<number | null>(null);

  const [countdown, setCountdown] = useState(3);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(timeLimit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  // ask for camera/mic
  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => videoRef.current?.play();
        }
      } catch {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsAudioOnly(true);
          streamRef.current = s;
        } catch {
          setError("Camera/Microphone not available.");
        }
      }
    })();

    return () => {
      // cleanup tracks + timers
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (countdownTimerRef.current) window.clearTimeout(countdownTimerRef.current);
      if (recordTimerRef.current) window.clearTimeout(recordTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // countdown -> start recording when 0
  // countdown useEffect
useEffect(() => {
  if (!streamRef.current || startedRef.current) return;
  if (countdown > 0) {
    const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);   // always return a cleanup fn
  }
  if (countdown === 0 && !recording && !startedRef.current) {
    startedRef.current = true;
    startRecording();
  }
}, [countdown, recording]);

// recording timer useEffect
useEffect(() => {
  if (!recording) return;
  if (seconds <= 0) {
    if (!stoppingRef.current) stopRecording(true);
    return;
  }
  const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
  return () => window.clearTimeout(id);   // always return a cleanup fn
}, [recording, seconds]);


  const startRecording = () => {
    if (!streamRef.current) {
      setError("No media stream available.");
      return;
    }
    if (recording) return; // guard

    chunksRef.current = [];
    stoppingRef.current = false;

    try {
      const mime = "video/webm;codecs=vp8,opus";
      const mr = new MediaRecorder(streamRef.current, { mimeType: mime });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        // onstop may fire multiple times in some environments; guard it
        if (uploadInProgressRef.current) return;
        uploadInProgressRef.current = true;

        try {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          if (blob.size === 0) {
            throw new Error("Recorded blob is empty.");
          }
          await submitBlob(blob);
        } catch (e: any) {
          console.error("submitBlob failed", e);
          setError(e?.message ?? "Upload failed");
        } finally {
          uploadInProgressRef.current = false;
        }
      };

      mr.start(100); // timeslice
      setRecording(true);
      setSeconds(timeLimit); // ensure timer starts from timeLimit
      console.debug("[REC] recording started");
    } catch (err: any) {
      console.error("startRecording error", err);
      setError("Failed to start recorder: " + (err?.message ?? String(err)));
    }
  };

  const stopRecording = (auto = false) => {
    if (stoppingRef.current) {
      return; // already stopping
    }
    stoppingRef.current = true;

    try {
      if (!mediaRecorderRef.current) {
        setRecording(false);
        return;
      }
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      } else {
        // if already inactive, still trigger onstop logic by manually calling submit path
        // (rare; normally onstop will fire)
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        if (blob.size > 0) {
          uploadInProgressRef.current = true;
          submitBlob(blob).finally(() => (uploadInProgressRef.current = false));
        }
      }
    } catch (err: any) {
      console.error("stopRecording error", err);
      setError("Failed to stop recorder: " + (err?.message ?? String(err)));
      stoppingRef.current = false;
    } finally {
      setRecording(false);
    }
  };

  const submitBlob = async (blob: Blob) => {
    // avoid multiple concurrent uploads
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString().replace(/[:.]/g, "-");
      const path = `${sessionId}/${qid}-${now}.webm`;

      console.debug("[REC] uploading to storage:", path);

      // upload to Supabase storage
      const { error: upErr } = await supabaseClient.storage
        .from("recordings")
        .upload(path, blob, {
          cacheControl: "0",
          contentType: "video/webm",
          upsert: false,
        });

      if (upErr) {
        console.error("upload error", upErr);
        throw upErr;
      }

      // insert answer row
      const duration = Math.max(0, timeLimit - seconds);
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: Number(qid),
          video_path: path,
          duration,
        }),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error || "answers insert failed");

      // success -> navigate back to interview (interview will decide next question)
      router.push(
        `/interview?sessionId=${sessionId}&skill=${encodeURIComponent(skill)}&name=${encodeURIComponent(name)}`
      );
    } catch (e: any) {
      console.error("submitBlob failed:", e);
      setError(e?.message ?? "Upload/DB failed");
    } finally {
      setSubmitting(false);
      stoppingRef.current = false;
    }
  };

  const timeColor = useMemo(() => {
    if (seconds <= 10) return "bg-red-600";
    if (seconds <= 30) return "bg-yellow-500";
    return "bg-white/20";
  }, [seconds]);

  return (
    <div className="relative min-h-screen w-full bg-black text-white">
      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full border border-white/20 ${timeColor}`}>
        {!recording && countdown > 0
          ? `Starting in ${countdown}…`
          : recording
          ? `Time left: ${seconds}s`
          : "Starting…"}
      </div>

      <div className="w-full h-screen grid place-items-center">
        {isAudioOnly ? (
          <div className="w-64 h-64 rounded-full bg-white/10 border border-white/20 grid place-items-center">
            <span className="text-white/80">Audio-only Recording</span>
          </div>
        ) : (
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        {!recording ? (
          <button disabled className="px-6 py-3 rounded-full bg-gray-600 text-white/60">
            {countdown > 0 ? "Get Ready…" : "Preparing…"}
          </button>
        ) : (
          <button
            onClick={() => stopRecording(false)}
            disabled={submitting}
            className="px-8 py-3 rounded-full bg-[#3eb5e8] text-white font-semibold shadow-md hover:shadow-lg hover:bg-[#08bd80] transition-all duration-300"
          >
            {submitting ? "Submitting…" : "Stop & Submit"}
          </button>
        )}
      </div>

      {error && <div className="absolute top-4 right-4 bg-red-600/80 px-4 py-2 rounded">{error}</div>}
    </div>
  );
}
