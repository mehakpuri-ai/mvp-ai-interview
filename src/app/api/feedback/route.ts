// src/app/api/feedback/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    // If OPENAI_API_KEY exists, you can wire real analysis later.
    if (process.env.OPENAI_API_KEY) {
      // TODO: fetch transcripts + call OpenAI for real feedback
    }

    // Mock feedback for MVP
    return NextResponse.json({
      sessionId,
      strengths: [
        "Clear structure in most answers",
        "Good pace and confident delivery",
      ],
      improvements: [
        "Reduce filler words in high-pressure moments",
        "Add measurable outcomes in product examples",
      ],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 500 });
  }
}
