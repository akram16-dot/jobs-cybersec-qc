import JobsBoard from "@/components/JobsBoard";
import PageHeader from "@/components/PageHeader";
import { loadJobsByFeed } from "@/lib/loadJobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeletravailPage() {
  const jobs = await loadJobsByFeed("remote_na");
  const lastUpdate =
    jobs[0]?.fetched_at ?? jobs[0]?.posted_at ?? new Date().toISOString();

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
      <PageHeader
        current="teletravail"
        eyebrow="Canada · États-Unis"
        title={
          <>
            Postes 100 %{" "}
            <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-accent-500 bg-clip-text text-transparent">
              télétravail
            </span>
          </>
        }
        description="Postes en cybersécurité entièrement à distance, ouverts aux autres provinces canadiennes et aux États-Unis. Pour les offres québécoises, consultez l'onglet Québec."
        lastUpdate={lastUpdate}
        totalJobs={jobs.length}
      />

      <JobsBoard initialJobs={jobs} hideCityFilter hideRemoteToggle />

      <footer className="mt-24 pt-8 border-t border-white/[0.06] text-center text-xs text-white/30">
        Sources : Adzuna · Jooble · The Muse · Remotive · Remote OK · We Work
        Remotely · Findwork — Agrégation automatique, vérifiez toujours l'offre
        originale.
      </footer>
    </main>
  );
}
