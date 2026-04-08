import { sortByScore } from "./score";
import { supabaseAdmin } from "./supabase";
import type { Feed, JobRow } from "./types";

export async function loadJobsByFeed(feed: Feed): Promise<JobRow[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("jobs")
      .select("*")
      .eq("feed", feed)
      // Première passe côté DB : récence pure pour limiter à 1000 lignes
      .order("posted_at", { ascending: false, nullsFirst: false })
      .limit(1000);
    if (error) {
      console.error("[loadJobs] error", error);
      return [];
    }
    const rows = (data || []) as JobRow[];
    // Deuxième passe côté app : tri par score (récence + bonus senior)
    return sortByScore(rows);
  } catch (e) {
    console.error("[loadJobs] supabase non configuré", e);
    return [];
  }
}
