import { supabaseAdmin } from "./supabase";
import type { Feed, JobRow } from "./types";

export async function loadJobsByFeed(feed: Feed): Promise<JobRow[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("jobs")
      .select("*")
      .eq("feed", feed)
      .order("posted_at", { ascending: false, nullsFirst: false })
      .limit(1000);
    if (error) {
      console.error("[loadJobs] error", error);
      return [];
    }
    return (data || []) as JobRow[];
  } catch (e) {
    console.error("[loadJobs] supabase non configuré", e);
    return [];
  }
}
