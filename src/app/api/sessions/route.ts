// src/app/api/sessions/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name = null, email = null, skill = "Beginner" } = body;

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .insert([
        {
          id: uuidv4(),
          name,
          email,
          skill,
          started_at: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ session: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
