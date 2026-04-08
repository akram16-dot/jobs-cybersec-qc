// Findwork.dev API (gratuit avec token)
// https://findwork.dev/developers/
// Auth : header "Authorization: Token <KEY>"

import {
  detectCategory,
  detectExperience,
  detectRemote,
  isCybersecStrict,
  isQuebec,
  normalizeCity,
} from "../classify";
import type { Feed, NormalizedJob } from "../types";

interface FindworkJob {
  id: number | string;
  role: string;
  company_name: string;
  company_num_employees?: string;
  employment_type?: string;
  location?: string;
  remote?: boolean;
  logo?: string;
  url: string;
  text: string;
  date_posted: string;
  keywords?: string[];
  source?: string;
}
interface FindworkResponse {
  results: FindworkJob[];
}

async function fetchFindwork(
  search: string,
  remote = false
): Promise<FindworkJob[]> {
  const key = process.env.FINDWORK_API_KEY;
  if (!key) return [];
  const url = new URL("https://findwork.dev/api/jobs/");
  url.searchParams.set("search", search);
  if (remote) url.searchParams.set("remote", "true");
  url.searchParams.set("sort_by", "date");
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Token ${key}` },
    });
    if (!res.ok) {
      console.warn(`[findwork] ${res.status}`);
      return [];
    }
    const data = (await res.json()) as FindworkResponse;
    return data.results || [];
  } catch (e) {
    console.warn("[findwork] fetch error", e);
    return [];
  }
}

function build(j: FindworkJob, feed: Feed): NormalizedJob {
  return {
    source: "findwork",
    source_id: String(j.id),
    feed,
    title: j.role,
    company: j.company_name || null,
    city: normalizeCity(j.location || null),
    region: feed === "qc" ? "QC" : null,
    remote: !!j.remote || detectRemote(j.role, j.text || "", j.location || ""),
    experience: detectExperience(j.role, j.text || ""),
    category: detectCategory(j.role, j.text || ""),
    description: j.text
      ? j.text.replace(/<[^>]+>/g, " ").slice(0, 1500)
      : null,
    url: j.url,
    posted_at: j.date_posted ? new Date(j.date_posted).toISOString() : null,
  };
}

function safeBuild(j: FindworkJob, feed: Feed): NormalizedJob | null {
  try {
    return build(j, feed);
  } catch (e) {
    console.warn("[findwork] build error", e);
    return null;
  }
}

export async function fetchFindworkQc(): Promise<NormalizedJob[]> {
  try {
    const jobs = await fetchFindwork("cybersecurity");
    const out: NormalizedJob[] = [];
    for (const j of jobs) {
      if (!j?.role) continue;
      if (!isCybersecStrict(j.role)) continue;
      if (!isQuebec(j.location || "")) continue;
      const b = safeBuild(j, "qc");
      if (b) out.push(b);
    }
    return out;
  } catch (e) {
    console.warn("[findwork_qc] error", e);
    return [];
  }
}

export async function fetchFindworkRemoteNA(): Promise<NormalizedJob[]> {
  try {
    const jobs = await fetchFindwork("cybersecurity", true);
    const out: NormalizedJob[] = [];
    for (const j of jobs) {
      if (!j?.role) continue;
      if (!isCybersecStrict(j.role)) continue;
      if (isQuebec(j.location || "")) continue;
      const b = safeBuild(j, "remote_na");
      if (b) out.push(b);
    }
    return out;
  } catch (e) {
    console.warn("[findwork_remote_na] error", e);
    return [];
  }
}

export async function fetchFindworkFreelance(): Promise<NormalizedJob[]> {
  try {
    const jobs = await fetchFindwork("cybersecurity contract");
    const out: NormalizedJob[] = [];
    for (const j of jobs) {
      if (!j?.role) continue;
      if (!isCybersecStrict(j.role)) continue;
      const hay = `${j.employment_type || ""} ${j.text || ""}`.toLowerCase();
      if (!/contract|freelance|consultant|contractor/.test(hay)) continue;
      const b = safeBuild(j, "freelance");
      if (b) out.push(b);
    }
    return out;
  } catch (e) {
    console.warn("[findwork_freelance] error", e);
    return [];
  }
}
