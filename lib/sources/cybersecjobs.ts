// CyberSecJobs.com (flux RSS public, 100 % cybersec)
// https://cybersecjobs.com/feed/

import {
  detectCategory,
  detectExperience,
  detectRemote,
  isCybersecStrict,
  isQuebec,
  normalizeCity,
} from "../classify";
import { parseDate, parseRss } from "../rss";
import type { Feed, NormalizedJob } from "../types";

const RSS_URL = "https://cybersecjobs.com/feed/";

async function fetchFeed() {
  try {
    const res = await fetch(RSS_URL, {
      headers: { "User-Agent": "jobs-cybersec-qc/1.0" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRss(xml);
  } catch {
    return [];
  }
}

function build(it: ReturnType<typeof parseRss>[number], feed: Feed): NormalizedJob {
  // CyberSecJobs n'expose pas toujours la location dans le titre ;
  // elle est souvent dans la description.
  const hay = `${it.title} ${it.description}`;
  return {
    source: "cybersecjobs",
    source_id: it.guid,
    feed,
    title: it.title,
    company: null,
    city: normalizeCity(extractLocation(it.description)),
    region: feed === "qc" ? "QC" : null,
    remote: detectRemote(it.title, it.description, ""),
    experience: detectExperience(it.title, it.description),
    category: detectCategory(it.title, it.description),
    description: it.description || null,
    url: it.link,
    posted_at: parseDate(it.pubDate),
  };
}

function extractLocation(desc: string): string | null {
  const m = desc.match(/location[^\w]*([A-Za-zÀ-ÿ ,'-]+?)(?:\.|;|\||$)/i);
  return m ? m[1].trim() : null;
}

export async function fetchCyberSecJobsRemoteNA(): Promise<NormalizedJob[]> {
  const items = await fetchFeed();
  const out: NormalizedJob[] = [];
  for (const it of items) {
    // Le feed est 100 % cybersec mais on garde la vérif stricte par sécurité
    if (!isCybersecStrict(it.title)) continue;
    const hay = `${it.title} ${it.description}`.toLowerCase();
    if (!detectRemote(it.title, it.description, "")) continue;
    if (isQuebec(hay)) continue;
    out.push(build(it, "remote_na"));
  }
  return out;
}

export async function fetchCyberSecJobsFreelance(): Promise<NormalizedJob[]> {
  const items = await fetchFeed();
  const out: NormalizedJob[] = [];
  for (const it of items) {
    if (!isCybersecStrict(it.title)) continue;
    const hay = `${it.title} ${it.description}`.toLowerCase();
    if (!/contract|freelance|consultant|contractor|1099/.test(hay)) continue;
    out.push(build(it, "freelance"));
  }
  return out;
}
