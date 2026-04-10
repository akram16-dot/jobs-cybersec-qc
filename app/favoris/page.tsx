"use client";

import { useEffect, useState } from "react";
import JobsBoard from "@/components/JobsBoard";
import PageHeader from "@/components/PageHeader";
import type { JobRow } from "@/lib/types";

const CLIENT_ID_KEY = "jcsq_client_id";

export default function FavorisPage() {
  const [allJobs, setAllJobs] = useState<JobRow[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"favoris" | "postule">("favoris");

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
      .then((data) => {
        setAllJobs((data?.jobs as JobRow[]) || []);
        setAppliedIds(new Set<string>((data?.appliedIds as string[]) || []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const favorisJobs = allJobs.filter((j) => !appliedIds.has(j.id));
  const postuleJobs = allJobs.filter((j) => appliedIds.has(j.id));
  const displayJobs = tab === "favoris" ? favorisJobs : postuleJobs;

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
        description="Les offres sauvegardées et celles auxquelles vous avez déjà postulé. Stockées en base via un identifiant anonyme local — aucun compte requis."
        totalJobs={loading ? undefined : allJobs.length}
      />

      {/* Sous-navigation favoris / déjà postulé */}
      {!loading && allJobs.length > 0 && (
        <div className="mb-8 inline-flex p-1 rounded-xl bg-ink-800/60 border border-white/[0.06]">
          <button
            onClick={() => setTab("favoris")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "favoris"
                ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                : "text-white/50 hover:text-white/90"
            }`}
          >
            <span className={tab === "favoris" ? "text-accent-400" : "text-white/30"}>
              ★
            </span>{" "}
            Favoris
            <span className="ml-2 text-xs text-white/40 tabular-nums">
              {favorisJobs.length}
            </span>
          </button>
          <button
            onClick={() => setTab("postule")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "postule"
                ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                : "text-white/50 hover:text-white/90"
            }`}
          >
            <span className={tab === "postule" ? "text-blue-400" : "text-white/30"}>
              ✓
            </span>{" "}
            Déjà postulé
            <span className="ml-2 text-xs text-white/40 tabular-nums">
              {postuleJobs.length}
            </span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-white/40 text-sm animate-pulse">
          Chargement de vos favoris…
        </div>
      ) : allJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-ink-850/40 border border-dashed border-white/[0.08]">
          <div className="text-4xl mb-3 opacity-40">☆</div>
          <div className="text-white/60 text-base font-medium">
            Aucun favori pour le moment
          </div>
          <div className="text-white/40 text-sm mt-2 max-w-sm mx-auto">
            Cliquez sur l'étoile ★ pour sauvegarder une offre ou sur le check ✓
            pour la marquer comme « déjà postulé ».
          </div>
        </div>
      ) : displayJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-ink-850/40 border border-dashed border-white/[0.08]">
          <div className="text-white/50 text-sm">
            {tab === "favoris"
              ? "Aucune offre en favoris uniquement. Toutes vos offres sauvegardées sont dans « Déjà postulé »."
              : "Aucune offre marquée « Déjà postulé ». Cliquez sur le check ✓ à côté d'une offre pour la marquer."}
          </div>
          <button
            onClick={() => setTab(tab === "favoris" ? "postule" : "favoris")}
            className="mt-3 text-sm text-accent-400 hover:text-accent-300 transition-colors"
          >
            Voir {tab === "favoris" ? "« Déjà postulé »" : "les favoris"} →
          </button>
        </div>
      ) : (
        <JobsBoard
          initialJobs={displayJobs}
          hideCityFilter
          hideRemoteToggle
        />
      )}

      <footer className="mt-24 pt-8 border-t border-white/[0.06] text-center text-xs text-white/30">
        Vos favoris sont liés à ce navigateur via un identifiant anonyme. Pour
        les retrouver sur un autre appareil, recréez-les manuellement.
      </footer>
    </main>
  );
}
