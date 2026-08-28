# BYA Flow

Application de marketing en ligne : campagnes, contacts, automations et analytics.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- Tailwind CSS
- Supabase (base de données + auth)
- Déploiement prévu sur Vercel

## Démarrage

```bash
npm install
npm run dev
```

L'application démarre sur [http://localhost:3000](http://localhost:3000).

## Configuration

Copiez `.env.example` en `.env.local` et renseignez vos clés Supabase :

```bash
cp .env.example .env.local
```

## Base de données

Le schéma de départ est dans [sql/phase1_base.sql](sql/phase1_base.sql). Exécutez-le
dans l'éditeur SQL de votre projet Supabase.

## Structure

```
app/
  page.tsx           page d'accueil marketing
  dashboard/          tableau de bord
lib/
  supabase/client.ts  client Supabase
sql/
  phase1_base.sql     schéma de base
```

## Suivi

Voir [PROGRES.md](PROGRES.md) pour l'état d'avancement.
