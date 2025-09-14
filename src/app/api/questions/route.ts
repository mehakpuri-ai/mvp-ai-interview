// src/app/api/questions/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const skill = (searchParams.get("skill") || "Beginner").toLowerCase();

    const { data, error } = await supabaseAdmin
      .from("questions")
      .select("*")
      .ilike("slug", `%${skill}%`)
      .order("id", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ questions: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 500 });
  }
}
