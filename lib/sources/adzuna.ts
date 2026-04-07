// Source : Adzuna (https://developer.adzuna.com/)
// Endpoint Canada : https://api.adzuna.com/v1/api/jobs/ca/search/{page}
// Auth : query params app_id & app_key

import {
  detectCategory,
  detectExperience,
  detectRemote,
  isCybersec,
  isQuebec,
  normalizeCity,
} from "../classify";
import type { NormalizedJob } from "../types";

interface AdzunaResult {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
}
interface AdzunaResponse {
  results: AdzunaResult[];
}

const QUERIES = [
  "cybersecurity",
  "cybersecurite",
  "security analyst",
  "analyste securite",
  "pentest",
  "SOC",
];

export async function fetchAdzuna(): Promise<NormalizedJob[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) {
    console.warn("[adzuna] clés manquantes, source ignorée");
    return [];
  }

  const all: NormalizedJob[] = [];
  const seen = new Set<string>();

  for (const q of QUERIES) {
    // Adzuna : where=Quebec restreint à la province
    const url = new URL("https://api.adzuna.com/v1/api/jobs/ca/search/1");
    url.searchParams.set("app_id", id);
    url.searchParams.set("app_key", key);
    url.searchParams.set("results_per_page", "50");
    url.searchParams.set("what", q);
    url.searchParams.set("where", "Quebec");
    url.searchParams.set("content-type", "application/json");

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        console.warn(`[adzuna] ${q} -> ${res.status}`);
        continue;
      }
      const data = (await res.json()) as AdzunaResponse;
      for (const r of data.results || []) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);

        const location = r.location?.display_name || "";
        if (!isQuebec(location)) continue;
        if (!isCybersec(r.title, r.description)) continue;

        all.push({
          source: "adzuna",
          source_id: r.id,
          title: r.title,
          company: r.company?.display_name || null,
          city: normalizeCity(location),
          region: "QC",
          remote: detectRemote(r.title, r.description, location),
          experience: detectExperience(r.title, r.description),
          category: detectCategory(r.title, r.description),
          description: r.description?.slice(0, 1500) || null,
          url: r.redirect_url,
          posted_at: r.created || null,
        });
      }
    } catch (e) {
      console.warn(`[adzuna] erreur fetch ${q}`, e);
    }
  }
  return all;
}
