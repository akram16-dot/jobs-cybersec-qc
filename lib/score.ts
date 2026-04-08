// Score de tri des offres pour un consultant cybersécurité senior 5-6 ans.
// Principe : récence > pertinence senior (comme choisi par l'utilisateur).
// Score final = base_recence + bonus_senior - penalite_bruit

import type { NormalizedJob } from "./types";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Mots-clés qui indiquent une offre pertinente pour un consultant senior
const SENIOR_KEYWORDS = [
  "senior",
  "sr.",
  "lead",
  "principal",
  "staff",
  "consultant",
  "expert",
  "architect",
  "architecte",
  "5 ans",
  "5 years",
  "6 ans",
  "6 years",
  "5+ years",
  "5+ ans",
  "6+ years",
  "specialist",
  "specialiste",
];

// Mots-clés qui indiquent des postes à éviter pour un profil 5-6 ans
const ANTI_SENIOR_KEYWORDS = [
  "junior",
  "entry level",
  "entry-level",
  "stagiaire",
  "intern",
  "debutant",
  "etudiant",
  "student",
  "apprentice",
  "apprenti",
  "graduate program",
  "new grad",
  "vp ",
  "vice president",
  "chief information",
  "ciso",
  "director of",
  "directeur",
  "head of",
];

// Bonus pour domaines typiquement consultants
const CONSULTING_KEYWORDS = [
  "consultant",
  "consulting",
  "advisory",
  "audit",
  "assessment",
  "pentest",
  "red team",
  "architect",
  "architecte",
  "grc",
  "iso 27001",
  "nist",
  "soc 2",
  "pci",
];

/**
 * Calcule un score pour trier les offres.
 * Plus le score est élevé, plus l'offre remonte en tête de liste.
 *
 * Structure :
 *  - Score de récence : 0 à 1000 (décroît avec l'âge, 1000 = aujourd'hui, ~0 à 30 j)
 *  - Bonus senior     : 0 à 200  (boost pour offres matching profil senior)
 *  - Pénalité anti    : 0 à 300  (réduit pour offres junior/C-level)
 *  - Bonus consulting : 0 à 100  (valorise missions de consultation)
 */
export function computeScore(job: NormalizedJob): number {
  // 1) Récence : dominant. Une offre d'aujourd'hui vaut 1000 points,
  //    décroît linéairement jusqu'à 0 à J+30, puis plateau à 0.
  let recencyScore = 0;
  if (job.posted_at) {
    const ageDays = Math.max(
      0,
      (Date.now() - new Date(job.posted_at).getTime()) / 86_400_000
    );
    recencyScore = Math.max(0, 1000 - ageDays * 33.3); // 0 au bout de ~30 j
  } else {
    recencyScore = 100; // offres sans date -> score neutre bas
  }

  // 2) Bonus senior (max 200)
  const text = norm(`${job.title} ${job.description ?? ""}`);
  let seniorBonus = 0;
  const titleOnly = norm(job.title);
  for (const kw of SENIOR_KEYWORDS) {
    if (titleOnly.includes(kw)) {
      seniorBonus += 40; // match dans le titre : fort signal
      break;
    }
  }
  if (seniorBonus === 0) {
    for (const kw of SENIOR_KEYWORDS) {
      if (text.includes(kw)) {
        seniorBonus += 20;
        break;
      }
    }
  }
  if (job.experience === "senior") seniorBonus += 80;
  if (job.experience === "intermediaire") seniorBonus += 40;

  // 3) Pénalité anti-senior (réduit le score)
  let antiPenalty = 0;
  for (const kw of ANTI_SENIOR_KEYWORDS) {
    if (titleOnly.includes(kw)) {
      antiPenalty += 150; // C-level ou junior dans le titre : très pénalisant
      break;
    }
  }
  if (job.experience === "junior") antiPenalty += 100;

  // 4) Bonus consulting (max 100)
  let consultingBonus = 0;
  for (const kw of CONSULTING_KEYWORDS) {
    if (titleOnly.includes(kw)) {
      consultingBonus = 80;
      break;
    }
  }
  if (consultingBonus === 0) {
    for (const kw of CONSULTING_KEYWORDS) {
      if (text.includes(kw)) {
        consultingBonus = 30;
        break;
      }
    }
  }

  return recencyScore + seniorBonus - antiPenalty + consultingBonus;
}

/** Trie une liste d'offres par score décroissant. */
export function sortByScore<T extends NormalizedJob>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => computeScore(b) - computeScore(a));
}
