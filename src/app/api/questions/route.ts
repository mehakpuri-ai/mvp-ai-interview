// src/app/api/questions/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type QuestionRow = {
  id: number;
  slug: string;
  title: string;
  video_path: string;
  time_limit: number;
  skill?: string | null;
  [k: string]: unknown;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const skill = (searchParams.get('skill') || 'Beginner').toLowerCase();

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .ilike('slug', `%${skill}%`)
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase error fetching questions:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    return NextResponse.json({ questions: (data ?? []) as QuestionRow[] });
  } catch (err: unknown) {
    console.error('Unexpected error in /api/questions:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
