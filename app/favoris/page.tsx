"use client";

import { useEffect, useState } from "react";
import JobsBoard from "@/components/JobsBoard";
import NavHeader from "@/components/NavHeader";
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
      .then((data) => setJobs(((data?.jobs as JobRow[]) || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-medium mb-4">
          <span>★</span>
          Mes offres sauvegardées
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Mes <span className="text-yellow-400">favoris</span>
        </h1>
        <p className="mt-3 text-white/60 max-w-2xl">
          Les offres que vous avez marquées d'une étoile ★ sur ce navigateur.
          Stockées en base, synchronisées via un identifiant anonyme local — pas
          de compte requis.
        </p>
      </header>

      <NavHeader current="favoris" />

      {loading ? (
        <p className="text-white/50 py-8 text-center">Chargement…</p>
      ) : jobs.length === 0 ? (
        <p className="text-white/50 py-8 text-center">
          Aucun favori pour le moment. Cliquez sur l'étoile ☆ à côté d'une offre
          pour la sauvegarder ici.
        </p>
      ) : (
        <JobsBoard
          initialJobs={jobs}
          hideCityFilter
          hideRemoteToggle
        />
      )}
    </main>
  );
}
