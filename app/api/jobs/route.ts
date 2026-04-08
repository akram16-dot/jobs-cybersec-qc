// API publique pour le front : liste les offres avec filtres.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const feed = url.searchParams.get("feed") || "qc";
  const city = url.searchParams.get("city");
  const category = url.searchParams.get("category");
  const experience = url.searchParams.get("experience");
  const remote = url.searchParams.get("remote");
  const q = url.searchParams.get("q");

  let query = supabaseAdmin()
    .from("jobs")
    .select("*")
    .eq("feed", feed)
    .order("posted_at", { ascending: false, nullsFirst: false })
    .limit(1000);

  if (city) query = query.eq("city", city);
  if (category) query = query.eq("category", category);
  if (experience) query = query.eq("experience", experience);
  if (remote === "true") query = query.eq("remote", true);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ jobs: data });
}
