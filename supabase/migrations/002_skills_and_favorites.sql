-- Migration 002 : compétences détectées + favoris
-- À exécuter dans Supabase > SQL Editor

-- 1) Colonne skills (array de strings) sur jobs
alter table public.jobs
  add column if not exists skills text[] not null default '{}';

create index if not exists jobs_skills_gin_idx on public.jobs using gin (skills);

-- 2) Table des favoris : stockée par client_id anonyme (UUID dans localStorage)
create table if not exists public.favorites (
  client_id   text not null,
  job_id      uuid not null references public.jobs(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (client_id, job_id)
);

create index if not exists favorites_client_idx on public.favorites (client_id);

-- RLS : lecture/écriture publique mais cantonnée via client_id (le filtrage
-- est fait par l'API route côté serveur qui utilise service_role).
alter table public.favorites enable row level security;

drop policy if exists "Lecture publique favoris" on public.favorites;
create policy "Lecture publique favoris"
  on public.favorites for select
  using (true);

-- Pas de policy insert/delete : les mutations passent par service_role.
