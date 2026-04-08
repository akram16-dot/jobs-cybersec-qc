// Freelancer.com API (OAuth token)
// https://developers.freelancer.com/docs/projects/projects
// Auth : header "Freelancer-OAuth-V1: <TOKEN>"

import {
  detectCategory,
  detectExperience,
  isCybersecStrict,
} from "../classify";
import type { NormalizedJob } from "../types";

interface FreelancerProject {
  id: number;
  title: string;
  description?: string;
  preview_description?: string;
  seo_url?: string;
  time_submitted: number; // epoch seconds
  owner_id?: number;
  jobs?: { name: string }[];
  currency?: { code: string };
  budget?: { minimum?: number; maximum?: number };
}
interface FreelancerResponse {
  status: string;
  result?: { projects?: FreelancerProject[] };
}

async function fetchFreelancer(query: string): Promise<FreelancerProject[]> {
  const token = process.env.FREELANCER_OAUTH_TOKEN;
  if (!token) return [];
  // Endpoint : GET /api/projects/0.1/projects/active/?query=...
  const url = new URL(
    "https://www.freelancer.com/api/projects/0.1/projects/active/"
  );
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "100");
  url.searchParams.set("job_details", "true");
  url.searchParams.set("full_description", "true");
  try {
    const res = await fetch(url.toString(), {
      headers: { "Freelancer-OAuth-V1": token },
    });
    if (!res.ok) {
      console.warn(`[freelancer] ${res.status}`);
      return [];
    }
    const data = (await res.json()) as FreelancerResponse;
    return data.result?.projects || [];
  } catch (e) {
    console.warn("[freelancer] fetch error", e);
    return [];
  }
}

function build(p: FreelancerProject): NormalizedJob {
  const desc = p.description || p.preview_description || "";
  const budget = p.budget
    ? `Budget : ${p.budget.minimum ?? "?"}–${p.budget.maximum ?? "?"} ${
        p.currency?.code || ""
      }`
    : "";
  return {
    source: "freelancer",
    source_id: String(p.id),
    feed: "freelance",
    title: p.title,
    company: "Freelancer.com (client)",
    city: null,
    region: null,
    remote: true,
    experience: detectExperience(p.title, desc),
    category: detectCategory(p.title, desc),
    description: `${budget}\n\n${desc}`.slice(0, 1500),
    url: p.seo_url
      ? `https://www.freelancer.com/projects/${p.seo_url}`
      : `https://www.freelancer.com/projects/${p.id}`,
    posted_at: p.time_submitted
      ? new Date(p.time_submitted * 1000).toISOString()
      : null,
  };
}

export async function fetchFreelancerFreelance(): Promise<NormalizedJob[]> {
  const queries = ["cybersecurity", "penetration test", "security audit"];
  const out: NormalizedJob[] = [];
  const seen = new Set<string>();
  for (const q of queries) {
    const projects = await fetchFreelancer(q);
    for (const p of projects) {
      if (seen.has(String(p.id))) continue;
      seen.add(String(p.id));
      if (!isCybersecStrict(p.title)) continue;
      out.push(build(p));
    }
  }
  return out;
}
