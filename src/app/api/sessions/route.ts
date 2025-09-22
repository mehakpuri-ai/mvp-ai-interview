// src/app/api/sessions/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { v4 as uuidv4 } from 'uuid';

type CreateSessionBody = {
  name?: string | null;
  email?: string | null;
  skill?: string;
  [k: string]: unknown;
};

type SessionRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  skill?: string;
  started_at?: string;
  completed_at?: string | null;
  [k: string]: unknown;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CreateSessionBody>;
    const name = typeof body.name === 'string' ? body.name : null;
    const email = typeof body.email === 'string' ? body.email : null;
    const skill = typeof body.skill === 'string' && body.skill.length > 0 ? body.skill : 'Beginner';

    const id = uuidv4();
    const started_at = new Date().toISOString();

    const supabase = getSupabaseAdmin();

    const insertPayload: Partial<SessionRow> = {
      id,
      name,
      email,
      skill,
      started_at,
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert([insertPayload as unknown])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error creating session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ session: data as SessionRow });
  } catch (err: unknown) {
    console.error('sessions POST unexpected error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
