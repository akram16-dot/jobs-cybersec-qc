-- Migration à exécuter UNE FOIS dans Supabase > SQL Editor pour
-- ajouter le support des 3 fils (qc, remote_na, freelance).

-- 1. Ajouter la colonne feed
alter table public.jobs add column if not exists feed text not null default 'qc';

-- 2. Index pour accélérer les filtres par fil
create index if not exists jobs_feed_idx on public.jobs (feed);

-- 3. Remplacer la contrainte d'unicité pour inclure le feed
--    (ainsi la même offre peut apparaître dans plusieurs fils si pertinent)
alter table public.jobs drop constraint if exists jobs_source_source_id_key;
alter table public.jobs
  add constraint jobs_source_source_id_feed_key unique (source, source_id, feed);
