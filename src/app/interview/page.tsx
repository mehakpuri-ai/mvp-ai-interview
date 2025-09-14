// src/app/interview/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Q = {
  id: number;
  slug: string;
  title: string;
  video_path: string; // e.g. "/questions/q1.mp4"
  time_limit: number; // seconds
  skill?: string | null;
};

export default function InterviewPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const sessionId = sp.get("sessionId")!;
  const skill = sp.get("skill") || "Beginner";
  const name = sp.get("name") || "";

  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);

  const current = useMemo(() => questions[idx], [questions, idx]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/questions?skill=${encodeURIComponent(skill)}`);
      const j = await res.json();
      setQuestions(j.questions || []);
      setLoading(false);
      setVideoEnded(false);
    })();
  }, [skill]);

  useEffect(() => {
    setVideoEnded(false);
    if (videoRef.current) {
      // retrigger play
      videoRef.current.currentTime = 0;
      // try to autoplay programmatically
      videoRef.current
        .play()
        .catch(() => {
          // some browsers need user gesture; user can tap the video to start
        });
    }
  }, [current?.id]);

  if (loading) return <div className="min-h-screen grid place-items-center">Loading questions…</div>;
  if (!questions.length) return <div className="min-h-screen grid place-items-center">No questions found.</div>;

  const handleRecord = () => {
    if (!current) return;
    router.push(
      `/record/${current.id}?sessionId=${sessionId}&skill=${encodeURIComponent(
        skill
      )}&name=${encodeURIComponent(name)}&time=${current.time_limit}`
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* Fullscreen question video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={false}
        onEnded={() => setVideoEnded(true)}
        className="w-full h-screen object-cover"
        src={current.video_path.startsWith("/") ? current.video_path : `/${current.video_path}`}
      />

      {/* progress top-left */}
      <div className="absolute top-4 left-4 text-white/90 text-sm px-3 py-1 rounded-full bg-white/10 border border-white/20">
        Question {idx + 1} of {questions.length}
      </div>

      {/* title bottom */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center px-4">
        <h1 className="text-white text-2xl font-semibold drop-shadow">{current.title}</h1>
      </div>

      {/* Record button appears only after video ends */}
      {videoEnded && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <button
            onClick={handleRecord}
            className="px-8 py-3 rounded-full bg-[#3eb5e8] text-white font-semibold shadow-md hover:shadow-lg hover:bg-[#08bd80] transition-all duration-300"
          >
            Record Answer
          </button>
        </div>
      )}
    </div>
  );
}
