import JobsBoard from "@/components/JobsBoard";
import NavHeader from "@/components/NavHeader";
import { loadJobsByFeed } from "@/lib/loadJobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FreelancePage() {
  const jobs = await loadJobsByFeed("freelance");

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Mis à jour quotidiennement
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          <span className="text-emerald-400">Freelance</span> mondial
        </h1>
        <p className="mt-3 text-white/60 max-w-2xl">
          Missions et contrats pour freelances en cybersécurité, partout dans
          le monde : consultants, contractors, missions ponctuelles.
        </p>
      </header>

      <NavHeader current="freelance" />
      <JobsBoard
        initialJobs={jobs}
        hideCityFilter
        hideRemoteToggle
      />

      <footer className="mt-16 text-center text-xs text-white/30">
        Données : Adzuna · Jooble — Agrégation automatique, vérifiez toujours
        l'offre originale.
      </footer>
    </main>
  );
}
