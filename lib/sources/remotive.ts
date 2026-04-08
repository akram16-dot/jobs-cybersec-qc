// Remotive API (public, pas de clé)
// https://remotive.com/api/remote-jobs

import {
  detectCategory,
  detectExperience,
  isCybersecStrict,
  normalizeCity,
} from "../classify";
import type { Feed, NormalizedJob } from "../types";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}
interface RemotiveResponse {
  jobs: RemotiveJob[];
}

async function fetchRemotiveAll(search: string): Promise<RemotiveJob[]> {
  const url = new URL("https://remotive.com/api/remote-jobs");
  url.searchParams.set("search", search);
  url.searchParams.set("limit", "200");
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as RemotiveResponse;
    return data.jobs || [];
  } catch {
    return [];
  }
}

function build(j: RemotiveJob, feed: Feed): NormalizedJob {
  const loc = j.candidate_required_location || "";
  return {
    source: "remotive",
    source_id: String(j.id),
    feed,
    title: j.title,
    company: j.company_name || null,
    city: normalizeCity(loc),
    region: null,
    remote: true, // Remotive = 100 % remote
    experience: detectExperience(j.title, j.description || ""),
    category: detectCategory(j.title, j.description || ""),
    description: j.description
      ? j.description.replace(/<[^>]+>/g, " ").slice(0, 1500)
      : null,
    url: j.url,
    posted_at: j.publication_date
      ? new Date(j.publication_date).toISOString()
      : null,
  };
}

export async function fetchRemotiveRemoteNA(): Promise<NormalizedJob[]> {
  const jobs = await fetchRemotiveAll("cybersecurity");
  const out: NormalizedJob[] = [];
  for (const j of jobs) {
    if (!isCybersecStrict(j.title)) continue;
    const loc = (j.candidate_required_location || "").toLowerCase();
    // Exclure UK/Europe-only pour remote_na (on les reverra en freelance)
    if (
      loc.includes("europe") &&
      !loc.includes("worldwide") &&
      !loc.includes("anywhere") &&
      !loc.includes("usa") &&
      !loc.includes("canada")
    )
      continue;
    out.push(build(j, "remote_na"));
  }
  return out;
}

export async function fetchRemotiveFreelance(): Promise<NormalizedJob[]> {
  const jobs = await fetchRemotiveAll("cybersecurity");
  const out: NormalizedJob[] = [];
  for (const j of jobs) {
    if (!isCybersecStrict(j.title)) continue;
    const t = `${j.job_type || ""} ${j.title} ${j.description || ""}`.toLowerCase();
    if (!/contract|freelance|consultant|contractor/.test(t)) continue;
    out.push(build(j, "freelance"));
  }
  return out;
}
