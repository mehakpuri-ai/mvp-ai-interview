// src/app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type FeedbackRequestBody = {
  sessionId?: string | null;
  session_id?: string | null;
  [k: string]: unknown;
};

type FeedbackRow = {
  id?: number;
  session_id?: string;
  answer_id?: number | null;
  strengths?: string[] | null;
  improvements?: string[] | null;
  summary?: string | null;
  readiness_score?: number | null;
  created_at?: string;
  [k: string]: unknown;
};

type FeedbackResponse = {
  sessionId?: string | null;
  strengths: string[];
  improvements: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<FeedbackRequestBody>;
    const sessionId = (body.sessionId ?? body.session_id) ?? null;

    // Default mock feedback
    const strengths: string[] = [
      'Clear structure in most answers',
      'Good pace and confident delivery',
    ];
    const improvements: string[] = [
      'Reduce filler words in high-pressure moments',
      'Add measurable outcomes in product examples',
    ];

    // Optionally persist mock feedback if SUPABASE_SERVICE_ROLE_KEY is set
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && sessionId) {
      try {
        const supabase = getSupabaseAdmin();
        const now = new Date().toISOString();

        const insertPayload: Partial<FeedbackRow> = {
          session_id: sessionId,
          strengths,
          improvements,
          summary: 'Mock feedback (persisted)',
          readiness_score: Math.floor(60 + Math.random() * 30),
          created_at: now,
        };

        const { error: insertErr } = await supabase
          .from('feedback')
          .insert([insertPayload as unknown]);

        if (insertErr) {
          console.error('Failed to persist feedback to Supabase:', insertErr);
        }
      } catch (e) {
        console.error('Supabase persistence error in feedback route:', e);
      }
    }

    const responseBody: FeedbackResponse = {
      sessionId: sessionId ?? null,
      strengths,
      improvements,
    };

    return NextResponse.json(responseBody);
  } catch (err: unknown) {
    console.error('feedback POST error', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
