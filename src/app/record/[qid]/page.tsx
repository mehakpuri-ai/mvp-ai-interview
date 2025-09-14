// src/app/record/[qid]/page.tsx
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
  const chunksRef = useRef<BlobPart[]>([]);

  const [countdown, setCountdown] = useState(3);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(timeLimit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  // get media with fallback to audio only
  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s as any;
          videoRef.current.onloadedmetadata = () => videoRef.current?.play();
        }
      } catch {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsAudioOnly(true);
          streamRef.current = s;
          if (videoRef.current) {
            // audio-only, show placeholder background; no srcObject needed
          }
        } catch (e) {
          setError("Camera/Microphone not available.");
        }
      }
    })();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // countdown then start recording
  useEffect(() => {
    if (streamRef.current && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (streamRef.current && countdown === 0 && !recording) {
      startRecording();
    }
  }, [countdown, streamRef.current]);

  // timer tick during recording
  useEffect(() => {
    if (!recording) return;
    if (seconds <= 0) {
      // auto stop & submit
      stopRecording(true);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [recording, seconds]);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp8,opus" });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      await submitBlob(blob);
    };

    mr.start(100); // gather chunks
    setRecording(true);
  };

  const stopRecording = (auto = false) => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const submitBlob = async (blob: Blob) => {
    try {
      setSubmitting(true);
      const now = new Date().toISOString().replace(/[:.]/g, "-");
      const path = `${sessionId}/${qid}-${now}.webm`;

      // 1) upload to storage
      const { error: upErr } = await supabaseClient.storage
        .from("recordings")
        .upload(path, blob, {
          cacheControl: "0",
          contentType: "video/webm",
          upsert: false,
        });
      if (upErr) throw upErr;

      // 2) insert answers row
      const duration = timeLimit - seconds;
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
      if (j.error) throw new Error(j.error);

      // 3) get next question or go to results
      // we don't know total here, simply redirect back to /interview,
      // /interview will show next question based on remaining list.
      router.back(); // go back to interview page
      // or router.push(`/interview?sessionId=${sessionId}&skill=${encodeURIComponent(skill)}&name=${encodeURIComponent(name)}`);
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const timeColor = useMemo(() => {
    if (seconds <= 10) return "bg-red-600";
    if (seconds <= 30) return "bg-yellow-500";
    return "bg-white/20";
  }, [seconds]);

  return (
    <div className="relative min-h-screen w-full bg-black text-white">
      {/* timer top-left */}
      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full border border-white/20 ${timeColor}`}>
        {recording ? `Time: ${seconds}s` : countdown > 0 ? `Starting in ${countdown}…` : "Starting…"}
      </div>

      {/* preview */}
      <div className="w-full h-screen grid place-items-center">
        {isAudioOnly ? (
          <div className="w-64 h-64 rounded-full bg-white/10 border border-white/20 grid place-items-center">
            <span className="text-white/80">Audio-only Recording</span>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
        )}
      </div>

      {/* controls bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        {!recording ? (
          <button
            disabled
            className="px-6 py-3 rounded-full bg-gray-600 text-white/60"
          >
            {countdown > 0 ? "Get Ready…" : "Preparing…"}
          </button>
        ) : (
          <button
            onClick={() => stopRecording(false)}
            disabled={submitting}
            className="px-8 py-3 rounded-full bg-[#3eb5e8] text-white font-semibold shadow-md hover:shadow-lg hover:bg-[#08bd80] transition-all duration-300"
          >
            Stop & Submit
          </button>
        )}
      </div>

      {error && (
        <div className="absolute top-4 right-4 bg-red-600/80 px-4 py-2 rounded">{error}</div>
      )}
    </div>
  );
}
