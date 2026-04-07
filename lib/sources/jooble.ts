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
import type { NormalizedJob } from "../types";

interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  link: string;
  company: string;
  updated: string;
  id?: number | string;
}
interface JoobleResponse {
  jobs: JoobleJob[];
}

const QUERIES = [
  "cybersécurité",
  "cybersecurity",
  "sécurité informatique",
  "SOC analyste",
  "pentest",
];

const LOCATIONS = ["Québec", "Montréal"];

export async function fetchJooble(): Promise<NormalizedJob[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) {
    console.warn("[jooble] clé manquante, source ignorée");
    return [];
  }

  const all: NormalizedJob[] = [];
  const seen = new Set<string>();

  for (const q of QUERIES) {
    for (const loc of LOCATIONS) {
      try {
        const res = await fetch(`https://jooble.org/api/${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: q, location: loc, page: "1" }),
        });
        if (!res.ok) {
          console.warn(`[jooble] ${q}/${loc} -> ${res.status}`);
          continue;
        }
        const data = (await res.json()) as JoobleResponse;
        for (const j of data.jobs || []) {
          // Jooble n'a pas toujours d'id stable -> on hash le lien
          const sid = String(j.id ?? j.link);
          if (seen.has(sid)) continue;
          seen.add(sid);

          if (!isQuebec(j.location)) continue;
          if (!isCybersec(j.title, j.snippet)) continue;

          all.push({
            source: "jooble",
            source_id: sid,
            title: j.title,
            company: j.company || null,
            city: normalizeCity(j.location),
            region: "QC",
            remote: detectRemote(j.title, j.snippet, j.location),
            experience: detectExperience(j.title, j.snippet),
            category: detectCategory(j.title, j.snippet),
            description: j.snippet?.slice(0, 1500) || null,
            url: j.link,
            posted_at: j.updated ? new Date(j.updated).toISOString() : null,
          });
        }
      } catch (e) {
        console.warn(`[jooble] erreur fetch ${q}/${loc}`, e);
      }
    }
  }
  return all;
}
