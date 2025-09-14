"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Start() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [skill, setSkill] = useState<"Beginner" | "Intermediate">("Beginner");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const router = useRouter();

  const createSession = async (skip = false) => {
    if (!name || (!skip && !email) || !skill) return;

    try {
      setLoading(true);
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email: skip ? null : email,
          skill,
        }),
      });

      const j = await res.json();
      if (!j.session || !j.session.id) {
        throw new Error("Invalid API response: session not found");
      }

      // ✅ Pass skill directly, not "level"
      router.push(
        `/interview?session=${j.session.id}&skill=${skill}&name=${encodeURIComponent(
          name
        )}`
      );
    } catch (err) {
      console.error("Error creating session:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden font-lexend bg-white">
      {/* Intro Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onEnded={() => setVideoEnded(true)}
        className="absolute top-0 left-0 w-full h-full object-cover bg-white rounded-3xl"
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/10"></div>

      {/* Fade-in Form */}
      <AnimatePresence>
        {videoEnded && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute bottom-[20%] left-1/2 transform -translate-x-1/2 w-[95%] max-w-lg rounded-2xl shadow-xl p-6 backdrop-blur-lg bg-white/40 border border-white/10"
          >
            <h2 className="text-2xl font-bold text-black text-center mb-6">
              Ready to Begin?
            </h2>

            {/* Name Input */}
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 mb-3 rounded-lg border border-white/30 bg-white/10 text-black placeholder-black focus:border-[#3eb5e8] outline-none"
            />

            {/* Email Input */}
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 mb-3 rounded-lg border border-white/30 bg-white/10 text-black placeholder-black focus:border-[#3eb5e8] outline-none"
            />

            {/* Skill Selector */}
            <div className="flex gap-3 mb-5">
              {["Beginner", "Intermediate"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSkill(level as "Beginner" | "Intermediate")}
                  className={`flex-1 p-3 rounded-lg font-semibold border transition-all duration-300 ${
                    skill === level
                      ? "bg-[#3eb5e8] text-white border-[#3eb5e8]"
                      : "bg-white/50 text-black border-white/30 hover:bg-[#08bd80] hover:border-[#08bd80]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Begin Button */}
            <button
              onClick={() => createSession()}
              disabled={loading || !name || !email || !skill}
              className={`w-full px-8 py-2 rounded-full font-semibold shadow-md transition-all duration-300 ${
                loading || !name || !email || !skill
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-[#3eb5e8] text-white hover:shadow-lg hover:bg-[#08bd80]"
              }`}
            >
              {loading ? "Starting..." : "Begin Interview"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
