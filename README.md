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

## Tests

```bash
npm test
```

Tests unitaires (`vitest`) pour la logique pure sans dépendance base de
données : score de croissance, catalogue de plans, utilitaires.

## Configuration

Copiez `.env.example` en `.env.local` et renseignez vos clés du projet
Supabase **BYA FLOW** :

```bash
cp .env.example .env.local
```

Sans ces clés, le middleware d'authentification bloque toute page (y compris
la page publique peut planter si l'URL est vide) : `NEXT_PUBLIC_SUPABASE_URL`
et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont désormais requis pour lancer
l'application, même en développement.

## Base de données

Exécutez, dans l'ordre, dans l'éditeur SQL du projet Supabase **BYA FLOW** :

1. [sql/phase1_base.sql](sql/phase1_base.sql) — schéma initial (à faire
   évoluer vers le modèle e-commerce/CRM complet à partir de la Phase 4).
2. [sql/phase2_auth_multitenant.sql](sql/phase2_auth_multitenant.sql) —
   `profiles`, `organizations`, `organization_members`, `stores`, RLS et
   fonctions de création d'organisation.
3. [sql/phase3_dashboard_data.sql](sql/phase3_dashboard_data.sql) —
   `customers`, `products`, `orders`, `order_items` (schéma minimal pour le
   tableau de bord, étendu en Phase 4/5).
4. [sql/phase4_boutique_produits.sql](sql/phase4_boutique_produits.sql) —
   personnalisation boutique, `product_categories`, `product_images`,
   `product_variants`, colonnes complètes sur `products`, buckets Storage
   `product-images` et `store-assets`.
5. [sql/phase5_commandes_clients.sql](sql/phase5_commandes_clients.sql) —
   fiche client complète (tags, statut, notes), numérotation des commandes,
   paiement, adresse de livraison, policies d'écriture.
6. [sql/phase7_marketing.sql](sql/phase7_marketing.sql) — supprime les tables
   orphelines de la Phase 1 (`contacts`, `campaigns` v1, `campaign_events`),
   recrée `campaigns`/`campaign_recipients`, ajoute `coupons`, `carts`,
   `cart_items`.
7. [sql/phase8_automatisations.sql](sql/phase8_automatisations.sql) —
   `automations`, `automation_runs`, `notifications`, et les triggers
   Postgres qui les font réagir automatiquement (commande créée/livrée,
   panier abandonné).
8. [sql/phase9_analytics.sql](sql/phase9_analytics.sql) — `analytics_events`
   (préparation pour la Phase 11, vide pour l'instant).
9. [sql/phase12_facturation.sql](sql/phase12_facturation.sql) —
   `subscriptions` (un plan par organisation), backfill au plan gratuit,
   `create_organization_with_owner()` étendue.
10. [sql/phase15_admin_plateforme.sql](sql/phase15_admin_plateforme.sql) —
    colonne `profiles.is_platform_admin`, fonction `is_platform_admin()` et
    policies de lecture cross-tenant pour l'espace Admin Plateforme.
11. [sql/phase16_boutique_publique.sql](sql/phase16_boutique_publique.sql) —
    corrige la génération de `stores.slug` (trigger) et ajoute les policies
    de lecture anonyme nécessaires à la boutique publique (`/store/[slug]`).

Les Phases 10 (BYA Flow Score), 11 (couche IA), 13 (sécurité/tests) et 14
(production) n'ajoutent aucune table : tout se calcule à la volée depuis les
données existantes (voir `lib/score/`, `lib/ai/`).

## Admin Plateforme (réservé à BYA Digital)

`/admin-plateforme` donne une vue transverse sur toutes les organisations
clientes (nombre de clients, de boutiques, MRR estimé, répartition des
plans) — invisible pour un client normal, et protégée à la fois par une
policy RLS dédiée et par une vérification serveur (`notFound()` si non
autorisé). Aucune UI ne permet d'accorder ce rôle : après avoir exécuté
`sql/phase15_admin_plateforme.sql`, exécutez manuellement dans l'éditeur SQL
Supabase :

```sql
update profiles set is_platform_admin = true
where id = (select id from auth.users where email = 'votre-email@exemple.com');
```

## Authentification & onboarding

- Pages : `/login`, `/signup`, `/forgot-password`, `/reset-password`.
- `middleware.ts` protège toutes les routes sauf la liste publique
  (`/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`,
  `/auth/callback`) et redirige vers `/onboarding` tant qu'un utilisateur n'a
  pas d'organisation.
- `/onboarding` : assistant en 6 étapes qui crée l'organisation et la
  première boutique.

## Structure

```
app/
  (marketing)/page.tsx   page d'accueil publique
  (auth)/*/page.tsx       login, signup, forgot/reset password
  (app)/layout.tsx       layout applicatif (AppShell) + garde onboarding
  (app)/*/page.tsx        un dossier par module produit (dont produits/nouveau, produits/[id])
  auth/callback/route.ts échange du code Supabase (confirmation/reset)
  onboarding/page.tsx    assistant de création d'organisation
  store/[slug]/           boutique publique (accueil + fiche produit),
                          lecture anonyme, sans layout applicatif
  icon.png                favicon
components/
  ui/                     design system (Button, Card, Badge, EmptyState,
                          Pagination, ...)
  layout/                 Sidebar, Topbar, AppShell, ModulePlaceholder
  onboarding/             OnboardingWizard
  dashboard/              KpiCard, SalesChart, TopProducts, RecommendationsPanel
  boutique/               StoreForm
  produits/               ProductForm, ProductImages, ProductVariants,
                          CategoryQuickCreate, DeleteProductButton
  clients/                ClientForm, DeleteCustomerButton
  commandes/              OrderCreateForm, OrderStatusForm, CustomerQuickCreate
  campagnes/              CampaignForm, SendCampaignButton, DeleteCampaignButton
  promotions/             CouponForm, DeleteCouponButton
  paniers/                CartCreateForm, CartActions
  automatisations/        AutomationForm, DeleteAutomationButton
  notifications/          NotificationList
  analytics/              PeriodSelector, OrderStatusBreakdown
  score/                  GrowthScoreGauge, ScoreBreakdown
  facturation/            PlanCard
lib/
  actions/                Server Actions (auth, onboarding, store, products,
                          customers, orders, campaigns, coupons, carts,
                          automations, notifications, ai, billing,
                          platformAdmin)
  ai/                      architecture IA abstraite (types, fournisseur
                          heuristique par défaut, opportunités de croissance)
  billing/plans.ts        catalogue des plans SaaS (logique pure)
  data/store.ts           getCurrentStore() (organisation → boutique)
  data/publicStore.ts     lecture anonyme (boutique + produits publiés)
  data/platformAdmin.ts   isPlatformAdmin(), vue d'ensemble multi-clients
  data/growthScore.ts     récupération des données du BYA Flow Score
  data/subscription.ts    récupération de l'abonnement + usage réel
  score/calculateScore.ts logique pure du score (facteurs, poids, bandes)
  nav.ts                  définition de la navigation
  pagination.ts           taille de page et helpers .range()
  supabase/client.ts      client Supabase (navigateur)
  supabase/server.ts      client Supabase (Server Components/Route Handlers)
  utils.ts                helpers cn(), slugify()
sql/
  phase1_base.sql              schéma initial
  phase2_auth_multitenant.sql  auth, organisations, RLS
  phase3_dashboard_data.sql    customers, products, orders, order_items
  phase4_boutique_produits.sql boutique, catégories, produits complets, Storage
  phase5_commandes_clients.sql fiche client, paiement, expédition, écriture
  phase7_marketing.sql        campagnes, coupons, paniers abandonnés
  phase8_automatisations.sql  automations, notifications, triggers Postgres
  phase9_analytics.sql        analytics_events (préparation)
  phase12_facturation.sql     subscriptions, plans
middleware.ts             session + protection des routes
```

## Déploiement (Vercel)

Le projet cible est **`bya-flow`**. Le dépôt GitHub est déjà connecté
(`bya-digital/bya-flow`, branche `main`).

1. Sur [vercel.com](https://vercel.com), importez le dépôt
   `bya-digital/bya-flow` (ou vérifiez qu'il est déjà importé sous le nom de
   projet `bya-flow`).
2. Framework preset : **Next.js** (détecté automatiquement). Ne changez pas
   l'Output Directory — Vercel gère `.next` automatiquement, ne jamais le
   configurer sur `public` ni sur "Static Site".
3. Renseignez les variables d'environnement (Project Settings →
   Environment Variables), pour l'environnement **Production** :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` — l'URL finale de production (ex.
     `https://bya-flow.vercel.app` ou votre domaine personnalisé)
4. Déployez.
5. **Étape à ne pas oublier côté Supabase** : dans le projet Supabase
   **BYA FLOW** → Authentication → URL Configuration, ajoutez l'URL de
   production à la liste "Redirect URLs" (et mettez à jour "Site URL").
   Sans cette étape, les liens de confirmation d'inscription et de
   réinitialisation de mot de passe ne fonctionneront pas en production
   (ils redirigeront vers `localhost`).

## Feuille de route

Développement organisé en 14 phases (audit, socle, auth, dashboard, boutique,
commandes/clients, CRM, marketing, automatisations, analytics, score de
croissance, IA, facturation, production). Détail dans [PROGRES.md](PROGRES.md).

## Suivi

Voir [PROGRES.md](PROGRES.md) pour l'état d'avancement.
