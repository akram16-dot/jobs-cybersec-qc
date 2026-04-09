"use client";

import { useEffect, useState } from "react";
import JobsBoard from "@/components/JobsBoard";
import PageHeader from "@/components/PageHeader";
import type { JobRow } from "@/lib/types";

const CLIENT_ID_KEY = "jcsq_client_id";

export default function FavorisPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id =
      typeof window !== "undefined"
        ? window.localStorage.getItem(CLIENT_ID_KEY)
        : null;
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/favorites?client_id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => setJobs((data?.jobs as JobRow[]) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
      <PageHeader
        current="favoris"
        eyebrow="Sauvegardées"
        title={
          <>
            Mes{" "}
            <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-accent-500 bg-clip-text text-transparent">
              favoris
            </span>
          </>
        }
        description="Les offres que vous avez marquées d'une étoile sur ce navigateur. Stockées en base et synchronisées via un identifiant anonyme local — aucun compte requis."
        totalJobs={loading ? undefined : jobs.length}
      />

      {loading ? (
        <div className="py-16 text-center text-white/40 text-sm animate-pulse">
          Chargement de vos favoris…
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-ink-850/40 border border-dashed border-white/[0.08]">
          <div className="text-4xl mb-3 opacity-40">☆</div>
          <div className="text-white/60 text-base font-medium">
            Aucun favori pour le moment
          </div>
          <div className="text-white/40 text-sm mt-2 max-w-sm mx-auto">
            Cliquez sur l'icône étoile à côté d'une offre pour la sauvegarder
            ici et la retrouver plus tard.
          </div>
        </div>
      ) : (
        <JobsBoard initialJobs={jobs} hideCityFilter hideRemoteToggle />
      )}

      <footer className="mt-24 pt-8 border-t border-white/[0.06] text-center text-xs text-white/30">
        Vos favoris sont liés à ce navigateur via un identifiant anonyme. Pour
        les retrouver sur un autre appareil, recréez-les manuellement.
      </footer>
    </main>
  );
}
