"use client";

import { useEffect, useMemo, useState } from "react";
import type { JobRow } from "@/lib/types";

const PAGE_SIZE = 30;

const CATEGORIES: { value: string; label: string }[] = [
  { value: "", label: "Tous les postes" },
  { value: "soc", label: "SOC / Détection" },
  { value: "pentest", label: "Pentest / Offensif" },
  { value: "grc", label: "GRC / Conformité" },
  { value: "architecte", label: "Architecte" },
  { value: "ingenierie", label: "Ingénierie / DevSecOps" },
  { value: "gestion", label: "Gestion / CISO" },
  { value: "autre", label: "Autre" },
];

const EXPERIENCES: { value: string; label: string }[] = [
  { value: "", label: "Tous niveaux" },
  { value: "junior", label: "Junior" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "senior", label: "Senior" },
];

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

interface Props {
  initialJobs: JobRow[];
  /** Masquer le filtre ville (utile pour freelance mondial) */
  hideCityFilter?: boolean;
  /** Masquer le toggle télétravail (toujours true dans teletravail/freelance) */
  hideRemoteToggle?: boolean;
}

export default function JobsBoard({
  initialJobs,
  hideCityFilter = false,
  hideRemoteToggle = false,
}: Props) {
  const [jobs] = useState<JobRow[]>(initialJobs);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [experience, setExperience] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) if (j.city) set.add(j.city);
    return Array.from(set).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (city && j.city !== city) return false;
      if (category && j.category !== category) return false;
      if (experience && j.experience !== experience) return false;
      if (remoteOnly && !j.remote) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${j.title} ${j.company ?? ""} ${j.description ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [jobs, city, category, experience, remoteOnly, search]);

  // Reset à la page 1 dès qu'un filtre change
  useEffect(() => {
    setPage(1);
  }, [city, category, experience, remoteOnly, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageJobs = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
        <input
          type="text"
          placeholder="Rechercher (titre, entreprise...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="lg:col-span-2 px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-sm placeholder-white/40 focus:outline-none focus:border-emerald-500"
        />
        {!hideCityFilter && (
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="">Toutes les villes</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500"
        >
          {EXPERIENCES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {!hideRemoteToggle && (
          <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-5">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            Télétravail / hybride uniquement
          </label>
        )}
      </div>

      <div className="text-sm text-white/60 flex flex-wrap items-center justify-between gap-3">
        <div>
          {filtered.length} offre{filtered.length > 1 ? "s" : ""} au total
          {filtered.length > PAGE_SIZE && (
            <>
              {" "}— page {page} / {totalPages} (30 par page)
            </>
          )}
        </div>
      </div>

      {/* Liste */}
      <ul className="grid gap-3">
        {pageJobs.map((j) => (
          <li
            key={j.id}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <a
                  href={j.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-white hover:text-emerald-400 transition-colors"
                >
                  {j.title}
                </a>
                <div className="text-sm text-white/70 mt-1">
                  {j.company || "Entreprise non précisée"}
                  {j.city ? ` · ${j.city}` : ""}
                  {j.region && j.region !== "QC" ? ` · ${j.region}` : ""}
                  {j.remote ? " · Télétravail" : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {j.category && (
                  <span className="px-2 py-1 text-xs rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {CATEGORIES.find((c) => c.value === j.category)?.label ||
                      j.category}
                  </span>
                )}
                {j.experience && (
                  <span className="px-2 py-1 text-xs rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {j.experience}
                  </span>
                )}
                <span className="text-xs text-white/40">
                  {timeAgo(j.posted_at)}
                </span>
              </div>
            </div>
            {j.description && (
              <p className="mt-3 text-sm text-white/60 line-clamp-3">
                {j.description}
              </p>
            )}
            <div className="mt-2 text-xs text-white/30">source : {j.source}</div>
          </li>
        ))}
        {pageJobs.length === 0 && (
          <li className="p-8 text-center text-white/50 rounded-2xl bg-white/5 border border-white/10">
            Aucune offre ne correspond à ces filtres pour le moment.
          </li>
        )}
      </ul>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-30 hover:bg-white/10"
          >
            ← Précédent
          </button>
          <span className="text-sm text-white/60 px-3">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-30 hover:bg-white/10"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
