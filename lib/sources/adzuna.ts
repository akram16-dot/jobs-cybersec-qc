// Source : Adzuna (https://developer.adzuna.com/)
// Gère 3 fils : qc / remote_na / freelance (monde entier)
// Quota gratuit : 250 appels/mois → on reste sous 7 calls/jour (~210/mois).

import {
  detectCategory,
  detectExperience,
  detectRemote,
  isCybersec,
  isQuebec,
  normalizeCity,
} from "../classify";
import type { Feed, NormalizedJob } from "../types";

interface AdzunaResult {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  contract_time?: string;
  contract_type?: string;
}
interface AdzunaResponse {
  results: AdzunaResult[];
}

interface AdzunaCall {
  country: string; // 'ca' | 'us' | 'gb' | ...
  what: string;
  where?: string;
  extraParams?: Record<string, string>;
}

async function call(
  c: AdzunaCall,
  id: string,
  key: string
): Promise<AdzunaResult[]> {
  const url = new URL(
    `https://api.adzuna.com/v1/api/jobs/${c.country}/search/1`
  );
  url.searchParams.set("app_id", id);
  url.searchParams.set("app_key", key);
  url.searchParams.set("results_per_page", "50");
  url.searchParams.set("what", c.what);
  if (c.where) url.searchParams.set("where", c.where);
  url.searchParams.set("content-type", "application/json");
  if (c.extraParams) {
    for (const [k, v] of Object.entries(c.extraParams)) url.searchParams.set(k, v);
  }
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn(`[adzuna] ${c.country}/${c.what} -> ${res.status}`);
      return [];
    }
    const data = (await res.json()) as AdzunaResponse;
    return data.results || [];
  } catch (e) {
    console.warn(`[adzuna] fetch error`, e);
    return [];
  }
}

// ============ FIL QC ============
export async function fetchAdzunaQc(): Promise<NormalizedJob[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) return [];

  // 3 requêtes larges pour couvrir le Québec (vs 6 auparavant)
  const calls: AdzunaCall[] = [
    { country: "ca", what: "cybersecurity", where: "Quebec" },
    { country: "ca", what: "cybersécurité", where: "Quebec" },
    { country: "ca", what: "security analyst", where: "Quebec" },
  ];

  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const c of calls) {
    const results = await call(c, id, key);
    for (const r of results) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      const location = r.location?.display_name || "";
      if (!isQuebec(location)) continue;
      if (!isCybersec(r.title, r.description)) continue;
      out.push(buildJob(r, "qc", location));
    }
  }
  return out;
}

// ============ FIL REMOTE NORTH AMERICA ============
// Canada hors-QC + USA, uniquement télétravail
export async function fetchAdzunaRemoteNA(): Promise<NormalizedJob[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) return [];

  const calls: AdzunaCall[] = [
    { country: "ca", what: "cybersecurity remote" },
    { country: "us", what: "cybersecurity remote" },
  ];

  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const c of calls) {
    const results = await call(c, id, key);
    for (const r of results) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      const location = r.location?.display_name || "";
      // Exclure le QC (déjà couvert par le fil qc)
      if (isQuebec(location)) continue;
      if (!isCybersec(r.title, r.description)) continue;
      // Exiger explicitement le télétravail
      if (!detectRemote(r.title, r.description, location)) continue;
      const country = c.country === "us" ? "US" : "CA";
      out.push({ ...buildJob(r, "remote_na", location), region: country });
    }
  }
  return out;
}

// ============ FIL FREELANCE MONDIAL ============
export async function fetchAdzunaFreelance(): Promise<NormalizedJob[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) return [];

  // Adzuna n'a pas de marché "freelance" global, on tape les plus gros marchés
  // avec le mot-clé explicite "freelance" ou "contract".
  const calls: AdzunaCall[] = [
    { country: "us", what: "cybersecurity freelance" },
    { country: "gb", what: "cybersecurity contract" },
  ];

  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const c of calls) {
    const results = await call(c, id, key);
    for (const r of results) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      if (!isCybersec(r.title, r.description)) continue;
      // Heuristique freelance : contract_type = contract OU mot-clé dans le titre
      const t = `${r.title} ${r.description}`.toLowerCase();
      const looksFreelance =
        r.contract_type === "contract" ||
        /freelance|contractor|contract role|independent|self[- ]employed|1099|consultant/.test(
          t
        );
      if (!looksFreelance) continue;
      const location = r.location?.display_name || "";
      out.push({ ...buildJob(r, "freelance", location), region: c.country.toUpperCase() });
    }
  }
  return out;
}

function buildJob(
  r: AdzunaResult,
  feed: Feed,
  location: string
): NormalizedJob {
  return {
    source: "adzuna",
    source_id: r.id,
    feed,
    title: r.title,
    company: r.company?.display_name || null,
    city: normalizeCity(location),
    region: feed === "qc" ? "QC" : null,
    remote: detectRemote(r.title, r.description, location),
    experience: detectExperience(r.title, r.description),
    category: detectCategory(r.title, r.description),
    description: r.description?.slice(0, 1500) || null,
    url: r.redirect_url,
    posted_at: r.created || null,
  };
}
