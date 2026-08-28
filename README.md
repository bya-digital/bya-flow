# BYA Flow

AI Commerce Growth OS — la plateforme qui réunit boutique, produits, commandes,
clients/CRM, marketing, automatisations, analytics et IA dans un seul espace
de pilotage commercial.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- Tailwind CSS
- Supabase (base de données + auth)
- Déploiement : Vercel (projet `bya-flow`)

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

Le schéma de départ est dans [sql/phase1_base.sql](sql/phase1_base.sql) (à
remplacer par le modèle e-commerce/CRM multi-tenant en Phase 2). Exécutez-le
dans l'éditeur SQL de votre projet Supabase.

## Structure

```
app/
  (marketing)/page.tsx   page d'accueil publique
  (app)/layout.tsx       layout applicatif (AppShell)
  (app)/*/page.tsx        un dossier par module produit
components/
  ui/                     design system (Button, Card, Badge, EmptyState, ...)
  layout/                 Sidebar, Topbar, AppShell, ModulePlaceholder
lib/
  nav.ts                  définition de la navigation
  supabase/client.ts      client Supabase
  utils.ts                helper cn()
sql/
  phase1_base.sql         schéma de base (à faire évoluer)
```

## Feuille de route

Développement organisé en 14 phases (audit, socle, auth, dashboard, boutique,
commandes/clients, CRM, marketing, automatisations, analytics, score de
croissance, IA, facturation, production). Détail dans [PROGRES.md](PROGRES.md).

## Suivi

Voir [PROGRES.md](PROGRES.md) pour l'état d'avancement.
