// The Muse API (public, pas de clé)
// https://www.themuse.com/developers/api/v2
// Endpoint: https://www.themuse.com/api/public/jobs?page=0&category=...

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
}

async function fetchMusePage(
  level: string | undefined,
  location: string | undefined,
  page = 0
): Promise<MuseJob[]> {
  const url = new URL("https://www.themuse.com/api/public/jobs");
  url.searchParams.set("page", String(page));
  url.searchParams.set("category", "Data Science");
  if (level) url.searchParams.append("level", level);
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

// The Muse a une catégorie "Data Science" mais pas "Cybersecurity".
// On filtre strictement par mot-clé dans le titre.
async function fetchAllMuse(location?: string): Promise<MuseJob[]> {
  const out: MuseJob[] = [];
  // On tape quelques pages, chaque appel ~ 20 jobs
  for (let p = 0; p < 3; p++) {
    const jobs = await fetchMusePage(undefined, location, p);
    out.push(...jobs);
    if (jobs.length < 20) break;
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
