import JobsBoard from "@/components/JobsBoard";
import PageHeader from "@/components/PageHeader";
import { loadJobsByFeed } from "@/lib/loadJobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FreelancePage() {
  const jobs = await loadJobsByFeed("freelance");
  const lastUpdate =
    jobs[0]?.fetched_at ?? jobs[0]?.posted_at ?? new Date().toISOString();

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
      <PageHeader
        current="freelance"
        eyebrow="Missions mondiales"
        title={
          <>
            Missions{" "}
            <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-accent-500 bg-clip-text text-transparent">
              freelance
            </span>{" "}
            à travers le monde
          </>
        }
        description="Contrats, missions ponctuelles et projets pour consultants indépendants en cybersécurité. Agrégés depuis des sources internationales."
        lastUpdate={lastUpdate}
        totalJobs={jobs.length}
      />

      <JobsBoard initialJobs={jobs} hideCityFilter hideRemoteToggle />

      <footer className="mt-24 pt-8 border-t border-white/[0.06] text-center text-xs text-white/30">
        Sources : Adzuna · Jooble · Remotive · Remote OK · Findwork —
        Agrégation automatique, vérifiez toujours l'offre originale.
      </footer>
    </main>
  );
}
