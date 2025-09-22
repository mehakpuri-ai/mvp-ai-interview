// src/app/api/answers/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type IncomingBody = {
  sessionId?: string;
  session_id?: string;
  questionId?: number;
  question_id?: number;
  videoPath?: string;
  video_path?: string;
  duration?: number;
  duration_ms?: number;
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
    const body = (await req.json()) as IncomingBody;

    const sessionId = (body.sessionId ?? body.session_id) as string | undefined;
    const questionId = (body.questionId ?? body.question_id) as number | undefined;
    const videoPath = (body.videoPath ?? body.video_path) as string | undefined;
    const duration =
      (body.duration as number | undefined) ?? (body.duration_ms as number | undefined);

    if (!sessionId || !questionId || !videoPath || duration == null) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, questionId, videoPath, duration' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // build payload as Partial so DB can fill generated fields
    const insertRow: Partial<AnswerRow> = {
      session_id: sessionId,
      question_id: questionId,
      video_path: videoPath,
      duration,
    };

    // cast to unknown to satisfy supabase overloads (stable across versions)
    const { data, error } = await supabase
      .from('answers')
      .insert([insertRow as unknown])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error inserting answer:', error);
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }

    return NextResponse.json({ answer: data });
  } catch (err: unknown) {
    console.error('Unexpected error inserting answer:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
