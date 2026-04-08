// InfoSec-Jobs.com (flux RSS public, 100 % cybersec, international)
// https://infosec-jobs.com/feed

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

const RSS_URL = "https://infosec-jobs.com/feed";

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

function build(it: ReturnType<typeof parseRss>[number], feed: Feed, city: string | null): NormalizedJob {
  return {
    source: "infosecjobs",
    source_id: it.guid,
    feed,
    title: it.title,
    company: null,
    city,
    region: feed === "qc" ? "QC" : null,
    remote: detectRemote(it.title, it.description, ""),
    experience: detectExperience(it.title, it.description),
    category: detectCategory(it.title, it.description),
    description: it.description || null,
    url: it.link,
    posted_at: parseDate(it.pubDate),
  };
}

export async function fetchInfoSecJobsQc(): Promise<NormalizedJob[]> {
  const items = await fetchFeed();
  const out: NormalizedJob[] = [];
  for (const it of items) {
    if (!isCybersecStrict(it.title)) continue;
    if (!isQuebec(`${it.title} ${it.description}`)) continue;
    out.push(build(it, "qc", normalizeCity("Montréal")));
  }
  return out;
}

export async function fetchInfoSecJobsRemoteNA(): Promise<NormalizedJob[]> {
  const items = await fetchFeed();
  const out: NormalizedJob[] = [];
  for (const it of items) {
    if (!isCybersecStrict(it.title)) continue;
    if (!detectRemote(it.title, it.description, "")) continue;
    if (isQuebec(`${it.title} ${it.description}`)) continue;
    out.push(build(it, "remote_na", null));
  }
  return out;
}

export async function fetchInfoSecJobsFreelance(): Promise<NormalizedJob[]> {
  const items = await fetchFeed();
  const out: NormalizedJob[] = [];
  for (const it of items) {
    if (!isCybersecStrict(it.title)) continue;
    const hay = `${it.title} ${it.description}`.toLowerCase();
    if (!/contract|freelance|consultant|contractor/.test(hay)) continue;
    out.push(build(it, "freelance", null));
  }
  return out;
}
