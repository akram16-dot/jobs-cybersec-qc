// Heuristiques pour classer une offre à partir de son titre + description.
// Imparfait mais suffisant pour un premier filtre côté front.

import type { Category, Experience } from "./types";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function detectCategory(title: string, description = ""): Category {
  const t = norm(`${title} ${description}`);
  if (/(soc|siem|incident|csirt|cert |detection|threat hunt|monitoring)/.test(t))
    return "soc";
  if (/(pentest|penetration|offensive|red team|ethical hack|exploit)/.test(t))
    return "pentest";
  if (/(grc|gouvernance|conformite|risque|risk|audit|iso 27|nist|soc 2)/.test(t))
    return "grc";
  if (/(architect|architecte)/.test(t)) return "architecte";
  if (/(ingenieur|engineer|devsecops|cloud security|reseau|network)/.test(t))
    return "ingenierie";
  if (/(directeur|chef|manager|lead|gestionnaire|ciso|rssi)/.test(t))
    return "gestion";
  return "autre";
}

export function detectExperience(title: string, description = ""): Experience {
  const t = norm(`${title} ${description}`);
  if (/(stagiaire|stage|intern|etudiant|debutant|junior|entry)/.test(t))
    return "junior";
  if (/(senior|sr\.|principal|expert|10\+ ans|10\+ years|7\+ ans)/.test(t))
    return "senior";
  if (/(intermediaire|intermediate|mid|3\+ ans|5\+ ans|3-5)/.test(t))
    return "intermediaire";
  return null;
}

export function detectRemote(
  title: string,
  description = "",
  location = ""
): boolean {
  const t = norm(`${title} ${description} ${location}`);
  return /(teletravail|tele-travail|remote|a distance|hybride|hybrid|work from home|wfh)/.test(
    t
  );
}

const QC_CITIES = [
  "Montréal",
  "Québec",
  "Laval",
  "Gatineau",
  "Longueuil",
  "Sherbrooke",
  "Trois-Rivières",
  "Saguenay",
  "Lévis",
  "Terrebonne",
  "Saint-Jean-sur-Richelieu",
  "Brossard",
  "Drummondville",
  "Saint-Jérôme",
  "Granby",
];

export function normalizeCity(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const r = norm(raw);
  for (const c of QC_CITIES) {
    if (r.includes(norm(c))) return c;
  }
  // Cas générique : on garde la première composante (avant la virgule)
  const first = raw.split(",")[0]?.trim();
  return first || null;
}

export function isQuebec(location: string | null | undefined): boolean {
  if (!location) return false;
  const l = norm(location);
  return (
    /quebec|qc|montreal|laval|gatineau|sherbrooke|trois-rivieres|saguenay|levis/.test(
      l
    )
  );
}

const CYBER_KEYWORDS = [
  "cyber",
  "securite informatique",
  "security",
  "infosec",
  "soc",
  "pentest",
  "siem",
  "iam",
  "grc",
  "ciso",
  "rssi",
  "devsecops",
];

export function isCybersec(title: string, description = ""): boolean {
  const t = norm(`${title} ${description}`);
  return CYBER_KEYWORDS.some((k) => t.includes(k));
}
