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
  fetchCyberSecJobsFreelance,
  fetchCyberSecJobsRemoteNA,
} from "@/lib/sources/cybersecjobs";
import { fetchEmploisQcQc } from "@/lib/sources/emploisquebec";
import {
  fetchFindworkFreelance,
  fetchFindworkQc,
  fetchFindworkRemoteNA,
} from "@/lib/sources/findwork";
import { fetchFreelancerFreelance } from "@/lib/sources/freelancer";
import {
  fetchInfoSecJobsFreelance,
  fetchInfoSecJobsQc,
  fetchInfoSecJobsRemoteNA,
} from "@/lib/sources/infosecjobs";
import {
  fetchJoobleFreelance,
  fetchJoobleQc,
  fetchJoobleRemoteNA,
} from "@/lib/sources/jooble";
import { fetchMuseQc, fetchMuseRemoteNA } from "@/lib/sources/themuse";
import { fetchReedFreelance } from "@/lib/sources/reed";
import {
  fetchRemoteOkFreelance,
  fetchRemoteOkRemoteNA,
} from "@/lib/sources/remoteok";
import {
  fetchRemotiveFreelance,
  fetchRemotiveRemoteNA,
} from "@/lib/sources/remotive";
import { fetchWwrRemoteNA } from "@/lib/sources/weworkremotely";
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

// Priorités pour la déduplication inter-sources :
// plus le nombre est haut, plus la source est préférée
const SOURCE_PRIORITY: Record<string, number> = {
  adzuna: 10, // API propre, bonne description
  reed: 9,
  findwork: 8,
  themuse: 7,
  remotive: 6,
  remoteok: 6,
  infosecjobs: 5,
  cybersecjobs: 5,
  emploisqc: 7,
  wwr: 4,
  freelancer: 3, // projets, pas des emplois
  jooble: 2, // souvent agrégat des autres
};

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();

  const tasks: { label: string; run: () => Promise<NormalizedJob[]> }[] = [
    // Adzuna
    { label: "adzuna_qc", run: fetchAdzunaQc },
    { label: "adzuna_remote_na", run: fetchAdzunaRemoteNA },
    { label: "adzuna_freelance", run: fetchAdzunaFreelance },
    // Jooble
    { label: "jooble_qc", run: fetchJoobleQc },
    { label: "jooble_remote_na", run: fetchJoobleRemoteNA },
    { label: "jooble_freelance", run: fetchJoobleFreelance },
    // The Muse
    { label: "muse_qc", run: fetchMuseQc },
    { label: "muse_remote_na", run: fetchMuseRemoteNA },
    // Remotive
    { label: "remotive_remote_na", run: fetchRemotiveRemoteNA },
    { label: "remotive_freelance", run: fetchRemotiveFreelance },
    // Remote OK
    { label: "remoteok_remote_na", run: fetchRemoteOkRemoteNA },
    { label: "remoteok_freelance", run: fetchRemoteOkFreelance },
    // We Work Remotely
    { label: "wwr_remote_na", run: fetchWwrRemoteNA },
    // CyberSecJobs
    { label: "cybersecjobs_remote_na", run: fetchCyberSecJobsRemoteNA },
    { label: "cybersecjobs_freelance", run: fetchCyberSecJobsFreelance },
    // InfoSec-Jobs
    { label: "infosecjobs_qc", run: fetchInfoSecJobsQc },
    { label: "infosecjobs_remote_na", run: fetchInfoSecJobsRemoteNA },
    { label: "infosecjobs_freelance", run: fetchInfoSecJobsFreelance },
    // Emplois Québec
    { label: "emploisqc_qc", run: fetchEmploisQcQc },
    // Reed UK
    { label: "reed_freelance", run: fetchReedFreelance },
    // Findwork
    { label: "findwork_qc", run: fetchFindworkQc },
    { label: "findwork_remote_na", run: fetchFindworkRemoteNA },
    { label: "findwork_freelance", run: fetchFindworkFreelance },
    // Freelancer.com
    { label: "freelancer_freelance", run: fetchFreelancerFreelance },
  ];

  const results = await Promise.allSettled(tasks.map((t) => t.run()));

  const jobs: NormalizedJob[] = [];
  const counts: Record<string, number | string> = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      jobs.push(...r.value);
      counts[tasks[i].label] = r.value.length;
    } else {
      counts[tasks[i].label] = "error";
    }
  });

  // 1) Déduplication intra-source par (source, source_id, feed)
  const intraMap = new Map<string, NormalizedJob>();
  for (const j of jobs) intraMap.set(`${j.source}:${j.source_id}:${j.feed}`, j);

  // 2) Déduplication inter-sources par clé de contenu
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
  const dedupedCrossSource = intraMap.size - unique.length;

  let inserted = 0;
  if (unique.length > 0) {
    const supabase = supabaseAdmin();
    // Upsert par chunks de 500 pour éviter les payloads trop gros
    const CHUNK = 500;
    for (let i = 0; i < unique.length; i += CHUNK) {
      const batch = unique.slice(i, i + CHUNK);
      const { error, count } = await supabase
        .from("jobs")
        .upsert(batch, { onConflict: "source,source_id,feed", count: "exact" });
      if (error) {
        console.error("[ingest] upsert error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      inserted += count || batch.length;
    }
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
