"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <section className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_15%_28%,#ace2f9_10%,white_75%,#9ffcdd_95%)] p-6">
      <div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          Ace your PM Interviews with<br/>
          <span className="text-[#3eb5e8]">Instant AI feedback</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-700 mb-8">
          Video-Based Practice Sessions. Intelligent AI Analysis.
        </p>

        <button
          onClick={() => router.push("/start")}
          className="px-8 py-3 rounded-full bg-[#3eb5e8] text-white font-semibold shadow-md hover:shadow-lg hover:bg-[#08bd80] transition-all duration-300"
        >
          Start Free Practice
        </button>
      </div>
    </section>
  );
}
