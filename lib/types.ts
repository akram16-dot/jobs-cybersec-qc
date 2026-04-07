export type Experience = "junior" | "intermediaire" | "senior" | null;
export type Category =
  | "soc"
  | "pentest"
  | "grc"
  | "architecte"
  | "ingenierie"
  | "gestion"
  | "autre";

export interface NormalizedJob {
  source: string;
  source_id: string;
  title: string;
  company: string | null;
  city: string | null;
  region: string | null;
  remote: boolean;
  experience: Experience;
  category: Category;
  description: string | null;
  url: string;
  posted_at: string | null; // ISO
}

export interface JobRow extends NormalizedJob {
  id: string;
  fetched_at: string;
}
