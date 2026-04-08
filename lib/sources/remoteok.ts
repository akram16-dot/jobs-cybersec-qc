// Remote OK API (public, pas de clé)
// https://remoteok.com/api

import {
  detectCategory,
  detectExperience,
  isCybersecStrict,
  normalizeCity,
} from "../classify";
import type { Feed, NormalizedJob } from "../types";

interface RemoteOkJob {
  id: string;
  slug: string;
  epoch: number;
  date: string;
  company: string;
  company_logo?: string;
  position: string;
  tags: string[];
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  apply_url: string;
  url: string;
}

async function fetchRemoteOkAll(): Promise<RemoteOkJob[]> {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "jobs-cybersec-qc/1.0" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];
    // Le premier élément est un "legal notice", pas un job
    return (data as RemoteOkJob[]).filter(
      (j) => j && typeof j === "object" && j.id && j.position
    );
  } catch {
    return [];
  }
}

function build(j: RemoteOkJob, feed: Feed): NormalizedJob {
  return {
    source: "remoteok",
    source_id: String(j.id),
    feed,
    title: j.position,
    company: j.company || null,
    city: normalizeCity(j.location || null),
    region: null,
    remote: true,
    experience: detectExperience(j.position, j.description || ""),
    category: detectCategory(j.position, j.description || ""),
    description: j.description
      ? j.description.replace(/<[^>]+>/g, " ").slice(0, 1500)
      : null,
    url: j.url || j.apply_url || "",
    posted_at: j.date
      ? new Date(j.date).toISOString()
      : j.epoch
      ? new Date(j.epoch * 1000).toISOString()
      : null,
  };
}

export async function fetchRemoteOkRemoteNA(): Promise<NormalizedJob[]> {
  const jobs = await fetchRemoteOkAll();
  const out: NormalizedJob[] = [];
  for (const j of jobs) {
    if (!isCybersecStrict(j.position)) continue;
    out.push(build(j, "remote_na"));
  }
  return out;
}

export async function fetchRemoteOkFreelance(): Promise<NormalizedJob[]> {
  const jobs = await fetchRemoteOkAll();
  const out: NormalizedJob[] = [];
  for (const j of jobs) {
    if (!isCybersecStrict(j.position)) continue;
    const tagText = (j.tags || []).join(" ").toLowerCase();
    const hay = `${tagText} ${j.position} ${j.description || ""}`.toLowerCase();
    if (!/contract|freelance|consultant|contractor|part[- ]time/.test(hay))
      continue;
    out.push(build(j, "freelance"));
  }
  return out;
}
