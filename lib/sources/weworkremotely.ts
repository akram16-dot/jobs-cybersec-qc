// We Work Remotely (flux RSS public)
// https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss

import {
  detectCategory,
  detectExperience,
  isCybersecStrict,
} from "../classify";
import { parseDate, parseRss } from "../rss";
import type { NormalizedJob } from "../types";

const FEEDS = [
  "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
  "https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss",
];

async function fetchFeed(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "jobs-cybersec-qc/1.0" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRss(xml);
  } catch {
    return [];
  }
}

export async function fetchWwrRemoteNA(): Promise<NormalizedJob[]> {
  const out: NormalizedJob[] = [];
  const seen = new Set<string>();
  for (const url of FEEDS) {
    const items = await fetchFeed(url);
    for (const it of items) {
      if (seen.has(it.guid)) continue;
      seen.add(it.guid);
      if (!isCybersecStrict(it.title)) continue;
      // WWR titre = "Company: Title"
      const [company, ...rest] = it.title.split(":");
      const title = rest.join(":").trim() || it.title;
      out.push({
        source: "wwr",
        source_id: it.guid,
        feed: "remote_na",
        title,
        company: company?.trim() || null,
        city: null,
        region: null,
        remote: true,
        experience: detectExperience(title, it.description),
        category: detectCategory(title, it.description),
        description: it.description || null,
        url: it.link,
        posted_at: parseDate(it.pubDate),
      });
    }
  }
  return out;
}
