// The Muse API (public, pas de clé)
// https://www.themuse.com/developers/api/v2
// Endpoint: https://www.themuse.com/api/public/jobs?page=0

import {
  detectCategory,
  detectExperience,
  detectRemote,
  isCybersecStrict,
  isQuebec,
  normalizeCity,
} from "../classify";
import type { Feed, NormalizedJob } from "../types";

interface MuseJob {
  id: number;
  name: string;
  contents: string;
  publication_date: string;
  refs: { landing_page: string };
  company: { name: string };
  locations: { name: string }[];
  levels?: { name: string; short_name: string }[];
  categories?: { name: string }[];
}
interface MuseResponse {
  results: MuseJob[];
  page: number;
  page_count: number;
}

async function fetchMusePage(
  location: string | undefined,
  page = 0
): Promise<MuseJob[]> {
  const url = new URL("https://www.themuse.com/api/public/jobs");
  url.searchParams.set("page", String(page));
  if (location) url.searchParams.append("location", location);
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as MuseResponse;
    return data.results || [];
  } catch {
    return [];
  }
}

// The Muse n'a pas de catégorie "Cybersecurity" ni de vraie recherche plein-texte.
// On tire plusieurs pages puis on filtre par titre.
async function fetchAllMuse(location?: string): Promise<MuseJob[]> {
  const out: MuseJob[] = [];
  const seen = new Set<number>();
  for (let p = 0; p < 5; p++) {
    const jobs = await fetchMusePage(location, p);
    if (jobs.length === 0) break;
    for (const j of jobs) {
      if (seen.has(j.id)) continue;
      seen.add(j.id);
      out.push(j);
    }
  }
  return out;
}

function build(j: MuseJob, feed: Feed): NormalizedJob {
  const location = j.locations?.[0]?.name || "";
  return {
    source: "themuse",
    source_id: String(j.id),
    feed,
    title: j.name,
    company: j.company?.name || null,
    city: normalizeCity(location),
    region: feed === "qc" ? "QC" : null,
    remote: detectRemote(j.name, j.contents, location),
    experience: detectExperience(j.name, j.contents),
    category: detectCategory(j.name, j.contents),
    description: j.contents
      ? j.contents.replace(/<[^>]+>/g, " ").slice(0, 1500)
      : null,
    url: j.refs?.landing_page || "",
    posted_at: j.publication_date
      ? new Date(j.publication_date).toISOString()
      : null,
  };
}

export async function fetchMuseQc(): Promise<NormalizedJob[]> {
  const jobs = await fetchAllMuse("Montreal, Canada");
  const out: NormalizedJob[] = [];
  for (const j of jobs) {
    const loc = j.locations?.[0]?.name || "";
    if (!isQuebec(loc)) continue;
    if (!isCybersecStrict(j.name)) continue;
    out.push(build(j, "qc"));
  }
  return out;
}

export async function fetchMuseRemoteNA(): Promise<NormalizedJob[]> {
  const jobs = await fetchAllMuse("Flexible / Remote");
  const out: NormalizedJob[] = [];
  for (const j of jobs) {
    if (!isCybersecStrict(j.name)) continue;
    const loc = j.locations?.[0]?.name || "";
    if (isQuebec(loc)) continue;
    out.push(build(j, "remote_na"));
  }
  return out;
}
