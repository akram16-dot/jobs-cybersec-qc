"use client";

import { useEffect, useMemo, useState } from "react";
import { useFavorites } from "@/lib/useFavorites";
import type { JobRow } from "@/lib/types";

const PAGE_SIZE = 30;
const NEW_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 h

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

function isNew(iso: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < NEW_THRESHOLD_MS;
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
  const [favOnly, setFavOnly] = useState(false);
  const [skill, setSkill] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { favoriteIds, toggle: toggleFav } = useFavorites();

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) if (j.city) set.add(j.city);
    return Array.from(set).sort();
  }, [jobs]);

  // Compétences détectées, triées par fréquence décroissante (top 40)
  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of jobs) {
      for (const s of j.skills || []) {
        counts.set(s, (counts.get(s) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([label, n]) => ({ label, n }));
  }, [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (city && j.city !== city) return false;
      if (category && j.category !== category) return false;
      if (experience && j.experience !== experience) return false;
      if (remoteOnly && !j.remote) return false;
      if (favOnly && !favoriteIds.has(j.id)) return false;
      if (skill && !(j.skills || []).includes(skill)) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${j.title} ${j.company ?? ""} ${j.description ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [jobs, city, category, experience, remoteOnly, favOnly, skill, search, favoriteIds]);

  // Reset à la page 1 dès qu'un filtre change
  useEffect(() => {
    setPage(1);
  }, [city, category, experience, remoteOnly, favOnly, skill, search]);

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
        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-emerald-500 lg:col-span-2"
        >
          <option value="">Toutes les compétences</option>
          {topSkills.map((s) => (
            <option key={s.label} value={s.label}>
              {s.label} ({s.n})
            </option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-3">
          {!hideRemoteToggle && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="w-4 h-4 accent-emerald-500"
              />
              Télétravail / hybride
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={favOnly}
              onChange={(e) => setFavOnly(e.target.checked)}
              className="w-4 h-4 accent-yellow-400"
            />
            Mes favoris uniquement
          </label>
        </div>
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
        {pageJobs.map((j) => {
          const fav = favoriteIds.has(j.id);
          const fresh = isNew(j.posted_at);
          return (
            <li
              key={j.id}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={j.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-white hover:text-emerald-400 transition-colors"
                    >
                      {j.title}
                    </a>
                    {fresh && (
                      <span className="px-2 py-0.5 text-[10px] uppercase tracking-wide font-bold rounded-md bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white/70 mt-1">
                    {j.company || "Entreprise non précisée"}
                    {j.city ? ` · ${j.city}` : ""}
                    {j.region && j.region !== "QC" ? ` · ${j.region}` : ""}
                    {j.remote ? " · Télétravail" : ""}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => toggleFav(j.id)}
                    aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
                    className={`text-xl leading-none transition-transform hover:scale-110 ${
                      fav ? "text-yellow-400" : "text-white/30 hover:text-white/70"
                    }`}
                    title={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    {fav ? "★" : "☆"}
                  </button>
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
              {j.skills && j.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {j.skills.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSkill(s === skill ? "" : s)}
                      className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${
                        s === skill
                          ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/60"
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-2 text-xs text-white/30">source : {j.source}</div>
            </li>
          );
        })}
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
