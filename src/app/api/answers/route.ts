// src/app/api/answers/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { session_id, question_id, video_path, duration } = body;

    const { data, error } = await supabaseAdmin
      .from("answers")
      .insert([{ session_id, question_id, video_path, duration }])
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ answer: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 500 });
  }
}
