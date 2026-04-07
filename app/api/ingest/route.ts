// Route d'ingestion : récupère les offres depuis toutes les sources et les
// enregistre dans Supabase. Protégée par INGEST_SECRET (header Authorization
// Bearer ...). Vercel Cron passe automatiquement le bon header si on configure
// le secret dans les variables d'env.

import { NextResponse } from "next/server";
import { fetchAdzuna } from "@/lib/sources/adzuna";
import { fetchJooble } from "@/lib/sources/jooble";
import { supabaseAdmin } from "@/lib/supabase";
import type { NormalizedJob } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.INGEST_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const [adz, joo] = await Promise.allSettled([fetchAdzuna(), fetchJooble()]);

  const jobs: NormalizedJob[] = [];
  if (adz.status === "fulfilled") jobs.push(...adz.value);
  if (joo.status === "fulfilled") jobs.push(...joo.value);

  // Déduplication finale par (source, source_id)
  const map = new Map<string, NormalizedJob>();
  for (const j of jobs) map.set(`${j.source}:${j.source_id}`, j);
  const unique = Array.from(map.values());

  let inserted = 0;
  if (unique.length > 0) {
    const supabase = supabaseAdmin();
    const { error, count } = await supabase
      .from("jobs")
      .upsert(unique, { onConflict: "source,source_id", count: "exact" });
    if (error) {
      console.error("[ingest] upsert error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    inserted = count || unique.length;
  }

  return NextResponse.json({
    ok: true,
    duration_ms: Date.now() - started,
    fetched: unique.length,
    upserted: inserted,
    sources: {
      adzuna: adz.status === "fulfilled" ? adz.value.length : `error`,
      jooble: joo.status === "fulfilled" ? joo.value.length : `error`,
    },
  });
}
