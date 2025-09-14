// src/app/results/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function Results() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = sp.get("sessionId") || "";
  const name = sp.get("name") || "";

  const [data, setData] = useState<{ strengths: string[]; improvements: string[] } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const j = await res.json();
      setData({ strengths: j.strengths ?? [], improvements: j.improvements ?? [] });
    })();
  }, [sessionId]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0b1220] to-[#0e1526] text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Nice work{name ? `, ${name}` : ""}! Here are your insights</h1>

        {!data ? (
          <div className="text-white/80">Processing your results…</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 p-5 bg-white/5">
              <h2 className="text-lg font-semibold mb-3">Strengths</h2>
              <ul className="list-disc pl-5 space-y-2 text-white/90">
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 p-5 bg-white/5">
              <h2 className="text-lg font-semibold mb-3">Areas to improve</h2>
              <ul className="list-disc pl-5 space-y-2 text-white/90">
                {data.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-10 flex gap-3">
          <button
            onClick={() => router.push("/start")}
            className="px-6 py-3 rounded-full bg-[#3eb5e8] text-white font-semibold hover:bg-[#08bd80] transition-all"
          >
            Try more questions
          </button>
          <button
            onClick={() => navigator.share
              ? navigator.share({ title: "AI PM Interview Practice", url: window.location.origin })
              : navigator.clipboard.writeText(window.location.origin)}
            className="px-6 py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20"
          >
            Share this tool
          </button>
        </div>
      </div>
    </div>
  );
}
