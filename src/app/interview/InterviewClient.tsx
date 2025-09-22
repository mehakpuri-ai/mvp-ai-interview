// src/app/interview/InterviewClient.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Q = {
  id: number;
  slug: string;
  title: string;
  video_path: string;
  time_limit: number;
  skill?: string | null;
};

export default function InterviewClient({ sessionId, skill, name }: { sessionId: string; skill: string; name: string; }) {
  const router = useRouter();

  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);

  const current = useMemo(() => questions[idx], [questions, idx]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/questions?skill=${encodeURIComponent(skill)}`);
        if (!res.ok) throw new Error(`Failed to fetch questions: ${res.status}`);
        const j = await res.json();
        setQuestions(j.questions || []);
      } catch (err) {
        console.error('Error fetching questions', err);
        setQuestions([]);
      } finally {
        setLoading(false);
        setVideoEnded(false);
      }
    })();
  }, [skill]);

  useEffect(() => {
    setVideoEnded(false);
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => { /* ignore autoplay failures */ });
      } catch (e) {
        /* ignore */
      }
    }
  }, [current?.id]);

  if (loading) return <div className="min-h-screen grid place-items-center">Loading questions…</div>;
  if (!questions.length) return <div className="min-h-screen grid place-items-center">No questions found.</div>;

  const handleRecord = () => {
    if (!current) return;
    router.push(
      `/record/${current.id}?sessionId=${encodeURIComponent(sessionId)}&skill=${encodeURIComponent(skill)}&name=${encodeURIComponent(name)}&time=${current.time_limit}`
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={false}
        onEnded={() => setVideoEnded(true)}
        className="w-full h-screen object-cover"
        src={current.video_path.startsWith('/') ? current.video_path : `/${current.video_path}`}
      />

      <div className="absolute top-4 left-4 text-white/90 text-sm px-3 py-1 rounded-full bg-white/10 border border-white/20">
        Question {idx + 1} of {questions.length}
      </div>

      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center px-4">
        <h1 className="text-white text-2xl font-semibold drop-shadow">{current.title}</h1>
      </div>

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
