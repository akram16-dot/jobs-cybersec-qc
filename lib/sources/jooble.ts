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

// IMPORTANT : Jooble exige le format complet "Ville, Province, Pays" sinon
// il matche n'importe quelle ville homonyme dans le monde (ex. Montreal, MO).
const LOCATIONS = [
  "Montreal, QC, Canada",
  "Quebec City, QC, Canada",
  "Laval, QC, Canada",
  "Gatineau, QC, Canada",
];

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
        // La ville de la recherche (ex: "Montreal" depuis "Montreal, QC, Canada")
        const searchedCity = loc.split(",")[0].trim();
        for (const j of data.jobs || []) {
          // Jooble n'a pas toujours d'id stable -> on hash le lien
          const sid = String(j.id ?? j.link);
          if (seen.has(sid)) continue;
          seen.add(sid);

          // Jooble retourne souvent juste "Canada" comme location.
          // On fait confiance à la location de recherche : on garde la job
          // sauf si elle est explicitement dans une autre province/pays.
          const jobLoc = (j.location || "").toLowerCase();
          const obviousNonQc =
            /\b(ontario|on|alberta|ab|bc|british columbia|manitoba|mb|saskatchewan|sk|nova scotia|ns|new brunswick|nb|usa|united states|france|maroc)\b/.test(
              jobLoc
            );
          if (obviousNonQc && !isQuebec(j.location)) continue;
          if (!isCybersec(j.title, j.snippet)) continue;

          all.push({
            source: "jooble",
            source_id: sid,
            title: j.title,
            company: j.company || null,
            // Si Jooble retourne juste "Canada" / pays, on garde la ville recherchée
            city:
              /^(canada|qc|quebec|québec)$/i.test((j.location || "").trim())
                ? searchedCity
                : normalizeCity(j.location) || searchedCity,
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
