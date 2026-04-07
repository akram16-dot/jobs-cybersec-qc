# Jobs Cybersécurité Québec — Guide d'installation

Site agrégateur d'offres d'emploi cybersécurité au Québec, mis à jour automatiquement chaque jour.
**Stack** : Next.js 15 + Supabase + Vercel — **coût total : 0 $/mois**.

---

## Vue d'ensemble (5 grandes étapes)

1. Créer les comptes et obtenir les clés API (Adzuna, Jooble, Supabase)
2. Créer la base de données Supabase
3. Pousser le code sur GitHub
4. Déployer sur Vercel + brancher les variables d'environnement
5. Vérifier que le cron quotidien fonctionne

Compte ~30 minutes au total. Tu n'as besoin d'aucune compétence technique avancée.

---

## Étape 1 — Créer les comptes et récupérer les clés API

### 1.1 Adzuna (source d'offres)

1. Va sur https://developer.adzuna.com/
2. Clique sur **"Sign up"** en haut à droite. Crée un compte gratuit.
3. Une fois connecté, va dans **"My API"** ou **"Dashboard"**.
4. Tu y verras deux valeurs à copier :
   - `Application ID` → ce sera **`ADZUNA_APP_ID`**
   - `Application Key` → ce sera **`ADZUNA_APP_KEY`**
5. Garde-les dans un fichier texte temporaire, on s'en sert plus tard.

> Quota gratuit : 250 appels / mois. Notre cron en utilise ~6 par jour = ~180/mois. Largement suffisant.

### 1.2 Jooble (source d'offres)

1. Va sur https://jooble.org/api/about
2. Clique sur **"Get API key"** ou **"Request API key"**.
3. Remplis le petit formulaire. La clé arrive en général tout de suite par email.
4. Copie la clé (longue chaîne avec des tirets) → ce sera **`JOOBLE_API_KEY`**.

### 1.3 Supabase (la base de données)

1. Va sur https://supabase.com/ et clique **"Start your project"**.
2. Connecte-toi avec GitHub (ou crée un compte).
3. Clique **"New project"**.
   - Nom : `jobs-cybersec-qc`
   - Mot de passe DB : génère-en un et garde-le précieusement
   - Région : **East US (North Virginia)** (le plus proche du Québec)
4. Attends ~2 minutes que le projet soit créé.
5. Une fois prêt, va dans **Project Settings → API** (icône engrenage à gauche).
   Tu y trouveras 3 valeurs à copier :
   - `Project URL` → **`NEXT_PUBLIC_SUPABASE_URL`**
   - `anon public key` → **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - `service_role secret` (clique "Reveal") → **`SUPABASE_SERVICE_ROLE_KEY`**
   ⚠️ La `service_role` est une clé secrète : ne jamais la mettre dans du code public.

### 1.4 Inventer un INGEST_SECRET

C'est juste un mot de passe que toi seul connais, qui protège l'URL de mise à jour.
Ouvre https://www.random.org/strings/ et génère une chaîne de 32 caractères, ou
invente-en une longue (lettres + chiffres). Garde-la → ce sera **`INGEST_SECRET`**.

---

## Étape 2 — Créer la base de données

1. Dans Supabase, ouvre **SQL Editor** (icône `</>` à gauche).
2. Clique **"New query"**.
3. Ouvre le fichier `supabase/schema.sql` du projet (sur ton ordi), copie tout son contenu.
4. Colle-le dans l'éditeur Supabase et clique **"Run"** (en bas à droite).
5. Tu devrais voir "Success. No rows returned". La table `jobs` est créée.

---

## Étape 3 — Pousser le code sur GitHub

Si tu n'as pas encore Git installé : https://git-scm.com/downloads → installateur Windows.

Dans un terminal, ouvert dans le dossier `jobs-cybersec-qc` :

```bash
git init
git add .
git commit -m "Première version du site Jobs Cybersec Québec"
```

Puis crée un repo GitHub vide :
1. https://github.com/new
2. Nom : `jobs-cybersec-qc`
3. **Ne coche rien** (pas de README, pas de .gitignore, GitHub te montre les commandes).
4. Copie les 2 lignes "…or push an existing repository…" et exécute-les dans ton terminal.

---

## Étape 4 — Déployer sur Vercel

1. Va sur https://vercel.com/ et connecte-toi avec GitHub.
2. Clique **"Add New… → Project"**.
3. Trouve `jobs-cybersec-qc` dans la liste et clique **"Import"**.
4. Vercel détecte automatiquement Next.js. **Avant** de cliquer Deploy, ouvre la
   section **"Environment Variables"** et ajoute, une par une :

   | Nom                              | Valeur                              |
   |----------------------------------|-------------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL`       | (depuis Supabase)                   |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | (depuis Supabase)                   |
   | `SUPABASE_SERVICE_ROLE_KEY`      | (depuis Supabase)                   |
   | `ADZUNA_APP_ID`                  | (depuis Adzuna)                     |
   | `ADZUNA_APP_KEY`                 | (depuis Adzuna)                     |
   | `JOOBLE_API_KEY`                 | (depuis Jooble)                     |
   | `INGEST_SECRET`                  | (la chaîne aléatoire que tu as inventée) |

5. Clique **"Deploy"**. Attends 1-2 minutes.
6. Tu as une URL en `.vercel.app`. Ouvre-la : la page s'affiche, mais sans offres
   pour l'instant (la base est vide).

---

## Étape 5 — Premier remplissage + vérifier le cron

### 5.1 Lancer manuellement la première ingestion

Ouvre un terminal et lance (remplace `TON_SECRET` et `TON-SITE`) :

```bash
curl -H "Authorization: Bearer TON_SECRET" https://TON-SITE.vercel.app/api/ingest
```

Tu devrais voir une réponse JSON du genre :

```json
{ "ok": true, "fetched": 42, "upserted": 42, "sources": { "adzuna": 25, "jooble": 17 } }
```

Recharge ta page Vercel : les offres sont là. 🎉

### 5.2 Vérifier le cron

Le fichier `vercel.json` contient :
```json
{ "crons": [ { "path": "/api/ingest", "schedule": "0 7 * * *" } ] }
```
Ça veut dire **tous les jours à 7 h UTC** (= 2 h ou 3 h du matin au Québec).

Vercel lance le cron automatiquement. Pour le voir : dans ton projet Vercel →
onglet **"Cron Jobs"**. Tu peux aussi cliquer **"Run now"** pour tester.

> ⚠️ Pour que les crons Vercel marchent **avec un secret**, il faut que la
> requête vienne d'un compte Vercel. C'est le cas : Vercel signe automatiquement
> ses requêtes de cron. Si pour une raison quelconque ça ne marche pas, dis-le
> moi et on basculera sur GitHub Actions (aussi gratuit).

---

## Maintenance courante

- **Voir les offres** : ton URL Vercel.
- **Forcer une mise à jour** : relancer la commande `curl` ci-dessus, ou
  cliquer "Run now" dans Vercel → Cron Jobs.
- **Modifier les filtres / sources** : édite `lib/sources/*.ts` puis `git push`.
  Vercel redéploie tout seul.
- **Voir les logs d'ingestion** : Vercel → onglet **Logs** → filtre `/api/ingest`.

## Limites connues

- Adzuna et Jooble ne couvrent pas 100 % du marché. On peut ajouter d'autres
  sources publiques (Emplois Québec a un flux ouvert) plus tard.
- La classification (SOC, pentest, GRC, junior/sénior, etc.) repose sur des
  mots-clés dans le titre/description. Ce n'est pas parfait mais c'est suffisant
  pour le filtrage.
- **Aucun scraping LinkedIn ou Indeed** : leurs CGU l'interdisent et ils
  bloquent les bots. Si tu veux y avoir accès, il faudra passer par leurs API
  payantes.

## Questions ?

Tout est dans ce fichier. Si tu bloques sur une étape, dis-moi exactement
laquelle et je t'aide.
