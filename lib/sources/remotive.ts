// Remotive API (public, pas de clé)
// https://remotive.com/api/remote-jobs
// NOTE : leur paramètre ?search= fait un match exact étrange. On récupère
// plutôt la catégorie "devops-sysadmin" et "software-dev" qui contiennent
// la majorité des offres cybersec, puis on filtre côté client.

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

async function fetchRemotive(
  params: Record<string, string> = {}
): Promise<RemotiveJob[]> {
  const url = new URL("https://remotive.com/api/remote-jobs");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as RemotiveResponse;
    return data.jobs || [];
  } catch {
    return [];
  }
}

// On récupère toutes les offres "devops-sysadmin" puisque Remotive n'a
// pas de catégorie "Cybersecurity" dédiée. Les postes cybersec y figurent.
async function fetchAllPotentialCybersec(): Promise<RemotiveJob[]> {
  const out: RemotiveJob[] = [];
  const seen = new Set<number>();
  // Catégories qui contiennent de la cybersec
  for (const cat of ["devops-sysadmin", "software-dev", "all-others"]) {
    const jobs = await fetchRemotive({ category: cat });
    for (const j of jobs) {
      if (seen.has(j.id)) continue;
      seen.add(j.id);
      out.push(j);
    }
  }
  return out;
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
  const jobs = await fetchAllPotentialCybersec();
  const out: NormalizedJob[] = [];
  for (const j of jobs) {
    if (!isCybersecStrict(j.title)) continue;
    const loc = (j.candidate_required_location || "").toLowerCase();
    // Exclure Europe-only (on préfère worldwide, USA, Canada pour ce fil)
    if (
      loc &&
      loc.includes("europe") &&
      !/worldwide|anywhere|usa|united states|canada|north america/.test(loc)
    )
      continue;
    out.push(build(j, "remote_na"));
  }
  return out;
}

export async function fetchRemotiveFreelance(): Promise<NormalizedJob[]> {
  const jobs = await fetchAllPotentialCybersec();
  const out: NormalizedJob[] = [];
  for (const j of jobs) {
    if (!isCybersecStrict(j.title)) continue;
    const t = `${j.job_type || ""} ${j.title} ${j.description || ""}`.toLowerCase();
    if (!/contract|freelance|consultant|contractor/.test(t)) continue;
    out.push(build(j, "freelance"));
  }
  return out;
}
