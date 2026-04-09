import JobsBoard from "@/components/JobsBoard";
import PageHeader from "@/components/PageHeader";
import { loadJobsByFeed } from "@/lib/loadJobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const jobs = await loadJobsByFeed("qc");
  const lastUpdate =
    jobs[0]?.fetched_at ?? jobs[0]?.posted_at ?? new Date().toISOString();

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
      <PageHeader
        current="qc"
        eyebrow="Province de Québec"
        title={
          <>
            Offres{" "}
            <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-accent-500 bg-clip-text text-transparent">
              cybersécurité
            </span>{" "}
            au Québec
          </>
        }
        description="Toutes les offres d'emploi en cybersécurité dans la province du Québec, agrégées depuis plusieurs sources publiques et rafraîchies automatiquement chaque jour."
        lastUpdate={lastUpdate}
        totalJobs={jobs.length}
      />

      <JobsBoard initialJobs={jobs} />

      <footer className="mt-24 pt-8 border-t border-white/[0.06] text-center text-xs text-white/30">
        Sources : Adzuna · Jooble · The Muse · Remotive · Remote OK · We Work
        Remotely · Findwork — Agrégation automatique, vérifiez toujours l'offre
        originale.
      </footer>
    </main>
  );
}
