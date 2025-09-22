// src/app/api/process-session/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type ProcessSessionBody = {
  sessionId?: string | null;
  session_id?: string | null;
  [k: string]: unknown;
};

type AnswerRow = {
  id: number;
  session_id: string;
  question_id: number;
  video_path: string;
  duration: number;
  created_at?: string;
  [k: string]: unknown;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ProcessSessionBody>;
    const sessionId = (body.sessionId ?? body.session_id) ?? null;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch answers
    const { data: answers, error: fetchErr } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId);

    if (fetchErr) {
      console.error('Failed to fetch answers for session', sessionId, fetchErr);
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }

    const answersList: AnswerRow[] = Array.isArray(answers) ? (answers as AnswerRow[]) : [];

    // Build feedback inserts (MVP mock)
    const now = new Date().toISOString();
    const feedbackInserts = answersList.map((a) => ({
      session_id: sessionId,
      answer_id: a.id ?? null,
      strengths: ['Clear structure', 'Good pacing'],
      improvements: ['Add metric', 'Be more concise'],
      summary: 'Mock summary: well structured, add more metrics.',
      readiness_score: Math.floor(60 + Math.random() * 30),
      created_at: now,
    }));

    if (feedbackInserts.length > 0) {
      const { error: insertErr } = await supabase
        .from('feedback')
        .insert(feedbackInserts as unknown[]); // cast here
      if (insertErr) {
        console.error('Failed to insert feedback for session', sessionId, insertErr);
        return NextResponse.json({ error: 'Failed to insert feedback' }, { status: 500 });
      }
    }

    // Mark session completed
    const { error: updateErr } = await supabase
      .from('sessions')
      .update({ completed_at: now })
      .eq('id', sessionId);

    if (updateErr) {
      console.error('Failed to update session completed_at for', sessionId, updateErr);
      return NextResponse.json(
        { success: true, warning: 'Feedback created but failed to update session completed_at' },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error('process-session POST error', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
