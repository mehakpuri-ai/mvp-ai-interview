import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const body = await req.json();
  const { sessionId } = body;
  if(!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  // Fetch answers
  const { data: answers } = await supabaseAdmin.from('answers').select('*').eq('session_id', sessionId);
  // For MVP: create mock feedback for each answer:
  for (const a of answers || []) {
    await supabaseAdmin.from('feedback').insert([{
      session_id: sessionId,
      answer_id: a.id,
      strengths: ['Clear structure','Good pacing'],
      improvements: ['Add metric','Be more concise'],
      summary: 'Mock summary: well structured, add more metrics.',
      readiness_score: Math.floor(60 + Math.random()*30)
    }]);
  }
  await supabaseAdmin.from('sessions').update({ completed_at: new Date().toISOString() }).eq('id', sessionId);
  return NextResponse.json({ success: true });
}
