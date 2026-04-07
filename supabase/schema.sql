-- Schéma Supabase pour Jobs Cybersec QC
-- À exécuter dans Supabase > SQL Editor une seule fois

create extension if not exists "pgcrypto";

create table if not exists public.jobs (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,            -- 'adzuna' | 'jooble' | ...
  source_id       text not null,            -- identifiant unique chez la source
  title           text not null,
  company         text,
  city            text,                     -- ville normalisée (Montréal, Québec, ...)
  region          text,                     -- province / région (toujours QC ici)
  remote          boolean not null default false,
  experience      text,                     -- 'junior' | 'intermediaire' | 'senior' | null
  category        text,                     -- 'soc' | 'pentest' | 'grc' | 'architecte' | 'autre'
  description     text,
  url             text not null,
  posted_at       timestamptz,
  fetched_at      timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists jobs_posted_at_idx   on public.jobs (posted_at desc nulls last);
create index if not exists jobs_city_idx        on public.jobs (city);
create index if not exists jobs_category_idx    on public.jobs (category);
create index if not exists jobs_experience_idx  on public.jobs (experience);
create index if not exists jobs_remote_idx      on public.jobs (remote);

-- Lecture publique (le site est ouvert)
alter table public.jobs enable row level security;

drop policy if exists "Lecture publique des offres" on public.jobs;
create policy "Lecture publique des offres"
  on public.jobs for select
  using (true);

-- Aucune policy d'écriture : seules les routes API serveur (service_role) peuvent insérer.
