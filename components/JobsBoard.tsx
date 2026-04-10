"use client";

import { useEffect, useMemo, useState } from "react";
import { useFavorites } from "@/lib/useFavorites";
import type { JobRow } from "@/lib/types";

const PAGE_SIZE = 30;
const NEW_THRESHOLD_MS = 48 * 60 * 60 * 1000;

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

const selectClass =
  "w-full appearance-none pl-3 pr-9 py-2.5 rounded-lg bg-ink-800/60 border border-white/[0.06] text-sm text-white/90 hover:border-white/10 focus:outline-none focus:border-accent/50 focus:bg-ink-800 transition-colors cursor-pointer bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22 fill=%22none%22><path d=%22M3 4.5L6 7.5L9 4.5%22 stroke=%22white%22 stroke-opacity=%220.4%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-no-repeat bg-[right_0.75rem_center]";

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

function initial(s: string | null): string {
  if (!s) return "?";
  const w = s.trim().split(/\s+/);
  if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

interface Props {
  initialJobs: JobRow[];
  hideCityFilter?: boolean;
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

  const { favoriteIds, appliedIds, toggle: toggleFav, toggleApplied } =
    useFavorites();

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) if (j.city) set.add(j.city);
    return Array.from(set).sort();
  }, [jobs]);

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
  }, [
    jobs,
    city,
    category,
    experience,
    remoteOnly,
    favOnly,
    skill,
    search,
    favoriteIds,
  ]);

  useEffect(() => {
    setPage(1);
  }, [city, category, experience, remoteOnly, favOnly, skill, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageJobs = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const hasActiveFilters =
    city || category || experience || remoteOnly || favOnly || skill || search;

  const resetFilters = () => {
    setCity("");
    setCategory("");
    setExperience("");
    setRemoteOnly(false);
    setFavOnly(false);
    setSkill("");
    setSearch("");
  };

  return (
    <section className="space-y-6">
      {/* ————————————— BARRE DE FILTRES ————————————— */}
      <div className="rounded-2xl bg-ink-850/60 border border-white/[0.06] backdrop-blur-sm shadow-card overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un titre, une entreprise, une technologie…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-ink-900/60 border border-white/[0.06] text-sm placeholder-white/35 focus:outline-none focus:border-accent/40 focus:bg-ink-900 transition-colors"
            />
          </div>
        </div>

        {/* Selects */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {!hideCityFilter && (
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={selectClass}
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
            className={selectClass}
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
            className={selectClass}
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
            className={selectClass}
          >
            <option value="">Toutes les compétences</option>
            {topSkills.map((s) => (
              <option key={s.label} value={s.label}>
                {s.label} ({s.n})
              </option>
            ))}
          </select>
        </div>

        {/* Toggles + reset */}
        <div className="px-4 py-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 bg-ink-900/40">
          <div className="flex flex-wrap items-center gap-5">
            {!hideRemoteToggle && (
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="w-4 h-4 accent-accent rounded"
                />
                Télétravail uniquement
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={favOnly}
                onChange={(e) => setFavOnly(e.target.checked)}
                className="w-4 h-4 accent-accent rounded"
              />
              Mes favoris uniquement
            </label>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-white/50 hover:text-white/90 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* ————————————— COMPTEUR ————————————— */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-white/50">
          <span className="font-medium text-white/90 tabular-nums">
            {filtered.length}
          </span>{" "}
          offre{filtered.length > 1 ? "s" : ""}
          {filtered.length > PAGE_SIZE && (
            <span className="text-white/30">
              {" "}
              · page {page} / {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* ————————————— LISTE ————————————— */}
      <ul className="grid gap-3">
        {pageJobs.map((j, idx) => {
          const fav = favoriteIds.has(j.id);
          const applied = appliedIds.has(j.id);
          const fresh = isNew(j.posted_at);
          return (
            <li
              key={j.id}
              className="group relative p-5 rounded-2xl bg-ink-850/50 border border-white/[0.06] hover:border-white/[0.12] hover:bg-ink-850/80 transition-all duration-200 animate-in-soft"
              style={{ animationDelay: `${Math.min(idx * 15, 300)}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Avatar entreprise (initiales) */}
                <div className="flex-shrink-0 hidden sm:flex h-11 w-11 rounded-xl bg-gradient-to-br from-ink-700 to-ink-800 border border-white/[0.06] items-center justify-center text-xs font-semibold text-white/70 tracking-wide">
                  {initial(j.company)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Ligne 1 : titre + badges haut */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={j.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[17px] font-semibold text-white hover:text-accent-300 transition-colors leading-snug"
                        >
                          {j.title}
                        </a>
                        {fresh && (
                          <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-semibold rounded bg-accent/15 text-accent-300 border border-accent/30">
                            Nouveau
                          </span>
                        )}
                        {applied && (
                          <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-semibold rounded bg-blue-500/15 text-blue-300 border border-blue-400/30">
                            Postulé
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-white/55 flex items-center gap-1.5 flex-wrap">
                        <span className="text-white/75">
                          {j.company || "Entreprise non précisée"}
                        </span>
                        {(j.city ||
                          (j.region && j.region !== "QC") ||
                          j.remote) && (
                          <span className="text-white/20">·</span>
                        )}
                        {j.city && <span>{j.city}</span>}
                        {j.region && j.region !== "QC" && (
                          <>
                            {j.city && <span className="text-white/20">·</span>}
                            <span>{j.region}</span>
                          </>
                        )}
                        {j.remote && (
                          <>
                            <span className="text-white/20">·</span>
                            <span className="text-accent-400/90">Télétravail</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-1.5">
                      {/* Bouton favori */}
                      <button
                        onClick={() => toggleFav(j.id)}
                        aria-label={
                          fav ? "Retirer des favoris" : "Ajouter aux favoris"
                        }
                        title={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
                        className={`h-9 w-9 rounded-lg border transition-all flex items-center justify-center ${
                          fav
                            ? "bg-accent/15 border-accent/40 text-accent-300"
                            : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/80 hover:border-white/15"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill={fav ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                      {/* Bouton "Déjà postulé" */}
                      <button
                        onClick={() => toggleApplied(j.id)}
                        aria-label={
                          applied
                            ? "Retirer de « Déjà postulé »"
                            : "Marquer « Déjà postulé »"
                        }
                        title={
                          applied
                            ? "Retirer de « Déjà postulé »"
                            : "Marquer « Déjà postulé »"
                        }
                        className={`h-9 w-9 rounded-lg border transition-all flex items-center justify-center ${
                          applied
                            ? "bg-blue-500/15 border-blue-400/40 text-blue-300"
                            : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/80 hover:border-white/15"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={applied ? "3" : "2"}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {j.description && (
                    <p className="mt-3 text-sm text-white/50 line-clamp-3 leading-relaxed">
                      {j.description}
                    </p>
                  )}

                  {/* Tags skills */}
                  {j.skills && j.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {j.skills.slice(0, 8).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSkill(s === skill ? "" : s)}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-colors ${
                            s === skill
                              ? "bg-accent/20 text-accent-300 border-accent/40"
                              : "bg-white/[0.03] text-white/55 border-white/[0.08] hover:bg-white/[0.06] hover:text-white/80"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Ligne basse : meta */}
                  <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between gap-3 flex-wrap text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {j.category && j.category !== "autre" && (
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-white/60 border border-white/[0.06]">
                          {CATEGORIES.find((c) => c.value === j.category)?.label ||
                            j.category}
                        </span>
                      )}
                      {j.experience && (
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-white/60 border border-white/[0.06] capitalize">
                          {j.experience}
                        </span>
                      )}
                      <span className="text-white/30">·</span>
                      <span className="text-white/40">{timeAgo(j.posted_at)}</span>
                    </div>
                    <div className="text-white/25 font-mono text-[10px] uppercase tracking-wider">
                      {j.source}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}

        {pageJobs.length === 0 && (
          <li className="p-12 text-center rounded-2xl bg-ink-850/40 border border-dashed border-white/[0.08]">
            <div className="text-white/40 text-sm">
              Aucune offre ne correspond à ces filtres.
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-3 text-sm text-accent-400 hover:text-accent-300 transition-colors"
              >
                Réinitialiser les filtres →
              </button>
            )}
          </li>
        )}
      </ul>

      {/* ————————————— PAGINATION ————————————— */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-ink-800/60 border border-white/[0.06] text-sm text-white/80 hover:bg-ink-700/60 hover:border-white/[0.12] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            ← Précédent
          </button>
          <span className="text-sm text-white/40 font-mono tabular-nums px-3">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg bg-ink-800/60 border border-white/[0.06] text-sm text-white/80 hover:bg-ink-700/60 hover:border-white/[0.12] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            Suivant →
          </button>
        </div>
      )}
    </section>
  );
}
