// Reed.co.uk API (UK, clé API gratuite)
// https://www.reed.co.uk/developers
// Auth : HTTP Basic avec la clé comme username, password vide

import {
  detectCategory,
  detectExperience,
  detectRemote,
  isCybersecStrict,
  normalizeCity,
} from "../classify";
import type { Feed, NormalizedJob } from "../types";

interface ReedJob {
  jobId: number;
  employerName: string;
  jobTitle: string;
  locationName: string;
  jobDescription: string;
  jobUrl: string;
  datePosted: string;
  contractType?: string; // 'permanent' | 'contract' | ...
}
interface ReedResponse {
  results: ReedJob[];
}

async function fetchReed(params: Record<string, string>): Promise<ReedJob[]> {
  const key = process.env.REED_API_KEY;
  if (!key) return [];
  const url = new URL("https://www.reed.co.uk/api/1.0/search");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("resultsToTake", "100");
  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
      },
    });
    if (!res.ok) {
      console.warn(`[reed] ${res.status}`);
      return [];
    }
    const data = (await res.json()) as ReedResponse;
    return data.results || [];
  } catch (e) {
    console.warn("[reed] fetch error", e);
    return [];
  }
}

function build(j: ReedJob, feed: Feed): NormalizedJob {
  return {
    source: "reed",
    source_id: String(j.jobId),
    feed,
    title: j.jobTitle,
    company: j.employerName || null,
    city: normalizeCity(j.locationName),
    region: "GB",
    remote: detectRemote(j.jobTitle, j.jobDescription || "", j.locationName || ""),
    experience: detectExperience(j.jobTitle, j.jobDescription || ""),
    category: detectCategory(j.jobTitle, j.jobDescription || ""),
    description: j.jobDescription
      ? j.jobDescription.replace(/<[^>]+>/g, " ").slice(0, 1500)
      : null,
    url: j.jobUrl,
    posted_at: j.datePosted ? new Date(j.datePosted).toISOString() : null,
  };
}

export async function fetchReedRemoteNA(): Promise<NormalizedJob[]> {
  // Reed est UK-only donc on les envoie plutôt sur freelance (voir ci-dessous)
  return [];
}

export async function fetchReedFreelance(): Promise<NormalizedJob[]> {
  const jobs = await fetchReed({
    keywords: "cybersecurity",
    contract: "true", // ne récupère que les postes contractuels
  });
  const out: NormalizedJob[] = [];
  for (const j of jobs) {
    if (!isCybersecStrict(j.jobTitle)) continue;
    out.push(build(j, "freelance"));
  }
  return out;
}
