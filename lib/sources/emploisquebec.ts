// Emplois Québec — service public du gouvernement du Québec.
// Ils exposent des flux RSS publics par recherche sauvegardée :
// https://placement.emploiquebec.gouv.qc.ca/mbe/ut/rechroffr/pubservlet.asp
// Il n'existe pas d'API officielle, mais il y a un endpoint XML de recherche.

import {
  detectCategory,
  detectExperience,
  detectRemote,
  isCybersec,
  isQuebec,
  normalizeCity,
} from "../classify";
import { parseDate, parseRss } from "../rss";
import type { NormalizedJob } from "../types";

// Flux RSS sauvegardé pour "cybersécurité" + "informatique sécurité"
// (équivalent des résultats de placement.emploiquebec.gouv.qc.ca)
const FEEDS = [
  "https://placement.emploiquebec.gouv.qc.ca/mbe/ut/suivroff/listoffr.asp?lang=FRAN&porte=1&cle=&mtcle=cybers%E9curit%E9&format=rss",
  "https://placement.emploiquebec.gouv.qc.ca/mbe/ut/suivroff/listoffr.asp?lang=FRAN&porte=1&cle=&mtcle=s%E9curit%E9+informatique&format=rss",
];

async function fetchFeed(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "jobs-cybersec-qc/1.0 (contact via github akram16-dot)",
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRss(xml);
  } catch {
    return [];
  }
}

export async function fetchEmploisQcQc(): Promise<NormalizedJob[]> {
  const out: NormalizedJob[] = [];
  const seen = new Set<string>();
  for (const url of FEEDS) {
    const items = await fetchFeed(url);
    for (const it of items) {
      if (seen.has(it.guid)) continue;
      seen.add(it.guid);
      if (!isCybersec(it.title, it.description)) continue;
      // Ce flux est 100 % québécois mais on garde la vérif
      if (!isQuebec(`${it.title} ${it.description}`)) continue;
      out.push({
        source: "emploisqc",
        source_id: it.guid,
        feed: "qc",
        title: it.title,
        company: null,
        city: normalizeCity(extractCity(it.description)),
        region: "QC",
        remote: detectRemote(it.title, it.description, ""),
        experience: detectExperience(it.title, it.description),
        category: detectCategory(it.title, it.description),
        description: it.description || null,
        url: it.link,
        posted_at: parseDate(it.pubDate),
      });
    }
  }
  return out;
}

function extractCity(desc: string): string | null {
  // Le flux Emplois Québec met souvent "Lieu : VILLE" ou "Région : ..."
  const m =
    desc.match(/lieu[^\w]*([A-Za-zÀ-ÿ '-]+?)(?:\.|;|\||,|$)/i) ||
    desc.match(/ville[^\w]*([A-Za-zÀ-ÿ '-]+?)(?:\.|;|\||,|$)/i);
  return m ? m[1].trim() : null;
}
