import { supabaseAdmin } from "@/lib/supabase";
import JobsBoard from "@/components/JobsBoard";
import type { JobRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadJobs(): Promise<JobRow[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("jobs")
      .select("*")
      .order("posted_at", { ascending: false, nullsFirst: false })
      .limit(500);
    if (error) {
      console.error("[page] load jobs error", error);
      return [];
    }
    return (data || []) as JobRow[];
  } catch (e) {
    console.error("[page] supabase non configuré", e);
    return [];
  }
}

export default async function Home() {
  const jobs = await loadJobs();
  const lastUpdate =
    jobs[0]?.fetched_at ?? jobs[0]?.posted_at ?? new Date().toISOString();

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Mis à jour quotidiennement
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Jobs <span className="text-emerald-400">Cybersécurité</span> Québec
        </h1>
        <p className="mt-3 text-white/60 max-w-2xl">
          Toutes les offres d'emploi en cybersécurité dans la province du
          Québec, agrégées depuis plusieurs sources publiques et rafraîchies
          automatiquement chaque jour.
        </p>
        <p className="mt-2 text-xs text-white/40">
          Dernière donnée : {new Date(lastUpdate).toLocaleString("fr-CA")}
        </p>
      </header>

      <JobsBoard initialJobs={jobs} />

      <footer className="mt-16 text-center text-xs text-white/30">
        Données : Adzuna · Jooble — Agrégation automatique, vérifiez toujours
        l'offre originale.
      </footer>
    </main>
  );
}
