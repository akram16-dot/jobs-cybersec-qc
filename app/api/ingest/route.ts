// Route d'ingestion : récupère les offres depuis toutes les sources et tous
// les fils (qc / remote_na / freelance) et les upsert dans Supabase.
// Protégée par INGEST_SECRET (header Authorization Bearer).

import { NextResponse } from "next/server";
import {
  fetchAdzunaFreelance,
  fetchAdzunaQc,
  fetchAdzunaRemoteNA,
} from "@/lib/sources/adzuna";
import {
  fetchJoobleFreelance,
  fetchJoobleQc,
  fetchJoobleRemoteNA,
} from "@/lib/sources/jooble";
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
  const results = await Promise.allSettled([
    fetchAdzunaQc(),
    fetchAdzunaRemoteNA(),
    fetchAdzunaFreelance(),
    fetchJoobleQc(),
    fetchJoobleRemoteNA(),
    fetchJoobleFreelance(),
  ]);
  const labels = [
    "adzuna_qc",
    "adzuna_remote_na",
    "adzuna_freelance",
    "jooble_qc",
    "jooble_remote_na",
    "jooble_freelance",
  ];

  const jobs: NormalizedJob[] = [];
  const counts: Record<string, number | string> = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      jobs.push(...r.value);
      counts[labels[i]] = r.value.length;
    } else {
      counts[labels[i]] = "error";
    }
  });

  // 1) Déduplication intra-source par (source, source_id, feed)
  const intraMap = new Map<string, NormalizedJob>();
  for (const j of jobs) intraMap.set(`${j.source}:${j.source_id}:${j.feed}`, j);

  // 2) Déduplication inter-sources par clé de contenu
  //    (même titre + même entreprise + même feed = même offre)
  //    On priorise Adzuna (généralement plus propre que Jooble).
  const SOURCE_PRIORITY: Record<string, number> = { adzuna: 2, jooble: 1 };
  const normKey = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const contentMap = new Map<string, NormalizedJob>();
  for (const j of intraMap.values()) {
    const titleKey = normKey(j.title);
    const companyKey = normKey(j.company || "unknown");
    const key = `${j.feed}|${titleKey}|${companyKey}`;
    const existing = contentMap.get(key);
    if (
      !existing ||
      (SOURCE_PRIORITY[j.source] || 0) > (SOURCE_PRIORITY[existing.source] || 0)
    ) {
      contentMap.set(key, j);
    }
  }
  const unique = Array.from(contentMap.values());
  const dedupedCrossSource =
    intraMap.size - unique.length;

  let inserted = 0;
  if (unique.length > 0) {
    const supabase = supabaseAdmin();
    const { error, count } = await supabase
      .from("jobs")
      .upsert(unique, {
        onConflict: "source,source_id,feed",
        count: "exact",
      });
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
    deduped_cross_source: dedupedCrossSource,
    sources: counts,
  });
}
