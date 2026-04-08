// Source : Jooble (https://jooble.org/api/about)
// Endpoint : POST https://jooble.org/api/{API_KEY}
// Body JSON : { keywords, location, page }

import {
  detectCategory,
  detectExperience,
  detectRemote,
  isCybersec,
  isQuebec,
  normalizeCity,
} from "../classify";
import type { Feed, NormalizedJob } from "../types";

interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  link: string;
  company: string;
  updated: string;
  id?: number | string;
  type?: string;
}
interface JoobleResponse {
  jobs: JoobleJob[];
}

async function queryJooble(
  key: string,
  keywords: string,
  location: string
): Promise<JoobleJob[]> {
  try {
    const res = await fetch(`https://jooble.org/api/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location, page: "1" }),
    });
    if (!res.ok) {
      console.warn(`[jooble] ${keywords}/${location} -> ${res.status}`);
      return [];
    }
    const data = (await res.json()) as JoobleResponse;
    return data.jobs || [];
  } catch (e) {
    console.warn(`[jooble] fetch error`, e);
    return [];
  }
}

function build(
  j: JoobleJob,
  feed: Feed,
  fallbackCity: string | null,
  region: string | null
): NormalizedJob {
  const sid = String(j.id ?? j.link);
  return {
    source: "jooble",
    source_id: sid,
    feed,
    title: j.title,
    company: j.company || null,
    city: normalizeCity(j.location) || fallbackCity,
    region,
    remote: detectRemote(j.title, j.snippet, j.location),
    experience: detectExperience(j.title, j.snippet),
    category: detectCategory(j.title, j.snippet),
    description: j.snippet?.slice(0, 1500) || null,
    url: j.link,
    posted_at: j.updated ? new Date(j.updated).toISOString() : null,
  };
}

// ============ FIL QC ============
const QC_QUERIES = ["cybersécurité", "cybersecurity", "SOC analyste"];
const QC_LOCATIONS = [
  "Montreal, QC, Canada",
  "Quebec City, QC, Canada",
];

export async function fetchJoobleQc(): Promise<NormalizedJob[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const q of QC_QUERIES) {
    for (const loc of QC_LOCATIONS) {
      const rawCity = loc.split(",")[0].trim();
      const city = normalizeCity(rawCity) || rawCity;
      const jobs = await queryJooble(key, q, loc);
      for (const j of jobs) {
        const sid = String(j.id ?? j.link);
        if (seen.has(sid)) continue;
        seen.add(sid);
        const jobLoc = (j.location || "").toLowerCase();
        const obviousNonQc =
          /\b(ontario|alberta|british columbia|manitoba|saskatchewan|nova scotia|new brunswick|usa|united states|france|maroc)\b/.test(
            jobLoc
          );
        if (obviousNonQc && !isQuebec(j.location)) continue;
        if (!isCybersec(j.title, j.snippet)) continue;
        const cityFinal = /^(canada|qc|quebec|québec)$/i.test(
          (j.location || "").trim()
        )
          ? city
          : normalizeCity(j.location) || city;
        out.push({ ...build(j, "qc", cityFinal, "QC"), city: cityFinal });
      }
    }
  }
  return out;
}

// ============ FIL REMOTE NA ============
export async function fetchJoobleRemoteNA(): Promise<NormalizedJob[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  const calls = [
    { q: "cybersecurity remote", loc: "Toronto, ON, Canada", region: "CA" },
    { q: "cybersecurity remote", loc: "New York, NY, USA", region: "US" },
  ];
  for (const c of calls) {
    const jobs = await queryJooble(key, c.q, c.loc);
    for (const j of jobs) {
      const sid = String(j.id ?? j.link);
      if (seen.has(sid)) continue;
      seen.add(sid);
      if (isQuebec(j.location)) continue; // éviter doublon avec fil qc
      if (!isCybersec(j.title, j.snippet)) continue;
      if (!detectRemote(j.title, j.snippet, j.location)) continue;
      out.push(build(j, "remote_na", null, c.region));
    }
  }
  return out;
}

// ============ FIL FREELANCE MONDIAL ============
export async function fetchJoobleFreelance(): Promise<NormalizedJob[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  // Jooble agrège mondialement, on peut cibler freelance sans location précise
  const calls = [
    { q: "cybersecurity freelance", loc: "" },
    { q: "cybersecurity contractor", loc: "" },
  ];
  for (const c of calls) {
    const jobs = await queryJooble(key, c.q, c.loc);
    for (const j of jobs) {
      const sid = String(j.id ?? j.link);
      if (seen.has(sid)) continue;
      seen.add(sid);
      if (!isCybersec(j.title, j.snippet)) continue;
      const t = `${j.title} ${j.snippet}`.toLowerCase();
      if (
        !/freelance|contractor|contract role|independent|self[- ]employed|consultant/.test(
          t
        )
      )
        continue;
      out.push(build(j, "freelance", null, null));
    }
  }
  return out;
}
