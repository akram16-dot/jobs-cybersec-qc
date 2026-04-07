# Jobs Cybersécurité Québec

Site agrégateur d'offres d'emploi en cybersécurité dans la province du Québec.
Mis à jour automatiquement chaque jour via Vercel Cron.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind
- **Supabase** (PostgreSQL gratuit) — stockage des offres
- **Vercel** (gratuit) — hébergement + cron quotidien
- **Sources** : API publiques Adzuna + Jooble (clés API gratuites)

## Pour démarrer

👉 Suis pas-à-pas le fichier [`SETUP.md`](./SETUP.md). Compte ~30 minutes,
aucune compétence technique avancée requise.

## Architecture

```
app/
  page.tsx                  # Page principale (server component, charge depuis Supabase)
  api/
    ingest/route.ts         # Cron quotidien : récupère + upsert dans Supabase
    jobs/route.ts           # API publique optionnelle pour le front
components/
  JobsBoard.tsx             # UI client : filtres + liste
lib/
  supabase.ts               # Clients Supabase
  classify.ts               # Heuristiques (catégorie, expérience, télétravail, QC)
  types.ts                  # Types partagés
  sources/
    adzuna.ts               # Source API Adzuna
    jooble.ts               # Source API Jooble
supabase/
  schema.sql                # Schéma de la table jobs
vercel.json                 # Configuration du cron quotidien
```

## Ajouter une nouvelle source

1. Crée `lib/sources/ma-source.ts` qui exporte `fetchMaSource(): Promise<NormalizedJob[]>`.
2. Importe-la dans `app/api/ingest/route.ts` et ajoute-la au `Promise.allSettled`.
3. `git push` → Vercel redéploie tout seul.

## Légal

Ce projet utilise uniquement des API publiques officielles. Aucun scraping de
LinkedIn, Indeed ou autres sites dont les CGU interdisent l'accès automatisé.
Les liens pointent vers les annonces originales chez la source.
