# Progrès — BYA Flow

## 2026-08-28 — Repositionnement produit : AI Commerce Growth OS

BYA Flow est redéfini comme un SaaS de croissance commerciale (boutique,
produits, commandes, clients/CRM, marketing, automatisations, analytics, IA)
destiné aux boutiques en ligne, entrepreneurs et petites entreprises.
Développement organisé en 14 phases (voir cahier des charges du projet).

Audit du socle existant réalisé avant toute modification : stack conservée
(Next.js + TS + Tailwind + Supabase), remote GitHub `bya-digital/bya-flow`
confirmé par le porteur de projet.

## 2026-08-28 — Phase 1 : socle technique, layout & navigation

- ESLint configuré (`eslint-config-next`), `next lint` propre.
- Design system de base dans `components/ui/` : `Button`, `Card`,
  `Badge`, `EmptyState`, `Skeleton`, `Alert`, `PageHeader`.
- Layout applicatif dans `components/layout/` : `Sidebar` (desktop fixe +
  drawer mobile), `Topbar` (recherche, notifications, org), `AppShell`.
- Navigation complète pilotée par données (`lib/nav.ts`) couvrant tous les
  modules produit : Dashboard, Boutique, Produits, Commandes, Clients & CRM,
  Campagnes, Automatisations, Promotions & coupons, Paniers abandonnés,
  Analytics, IA & recommandations, Paramètres, Facturation, Notifications,
  Sécurité & audit.
- Routes réorganisées en groupes : `app/(marketing)/` (page publique) et
  `app/(app)/` (espace applicatif, un dossier par module).
- Chaque module non encore développé affiche un état vide clair
  (`ModulePlaceholder`) indiquant sa phase de construction prévue —
  aucune fausse donnée, aucune fonctionnalité simulée.
- Vérifié : `next build` (17 routes générées), `next lint` (aucune erreur),
  navigation testée dans le navigateur (desktop + mobile), aucune erreur
  console/serveur.

Non couvert par cette phase (volontairement) : authentification, organisations
multi-tenant, schéma de données métier, contenu réel des modules — prévu à
partir de la Phase 2.

## 2026-08-28 — Phase 2 : authentification, multi-tenant & onboarding

- **Base de données** (`sql/phase2_auth_multitenant.sql`) : `profiles`,
  `organizations`, `organization_members`, `stores` (minimale, étendue en
  Phase 4). RLS activées partout ; fonctions `is_org_member()` /
  `is_org_admin()` en `SECURITY DEFINER` pour éviter toute récursion RLS ;
  `create_organization_with_owner()` crée l'organisation et son propriétaire
  de façon atomique (aucune policy d'insertion directe sur
  `organizations`/`organization_members`) ; trigger `handle_new_user()` crée
  automatiquement le profil à l'inscription Supabase Auth.
- **Auth Supabase** avec `@supabase/ssr` : `lib/supabase/client.ts` (browser),
  `lib/supabase/server.ts` (Server Components/Route Handlers), `middleware.ts`
  qui rafraîchit la session sur chaque requête.
- **Pages** `/login`, `/signup`, `/forgot-password`, `/reset-password` et
  `app/auth/callback` (échange du code de confirmation/récupération).
- **Protection des routes** centralisée dans `middleware.ts` : toute page hors
  d'une liste publique exige une session ; un utilisateur sans organisation
  est redirigé vers `/onboarding` ; un utilisateur déjà onboardé qui visite
  `/onboarding` ou `/login` est redirigé vers `/dashboard`.
- **Onboarding** (`/onboarding`, `components/onboarding/OnboardingWizard.tsx`)
  : assistant 6 étapes (entreprise, activité, devise, pays, objectif,
  première boutique) qui appelle `create_organization_with_owner`, crée la
  boutique et marque `profiles.onboarding_completed`.
- **Paramètres** (`/parametres`) : passe du placeholder à un contenu réel
  (organisation + profil connecté), comme annoncé en Phase 1.
- Topbar connectée : email de l'utilisateur, nom de l'organisation, menu de
  déconnexion fonctionnel (`signOut`).
- Vérifié : `next build` (25 routes, pages authentifiées en rendu dynamique
  `ƒ` comme attendu), `next lint` (aucune erreur).

### Validation en conditions réelles (projet Supabase "BYA FLOW")

`sql/phase1_base.sql` et `sql/phase2_auth_multitenant.sql` exécutés sur le
vrai projet Supabase. Testé de bout en bout dans le navigateur avec un compte
réel :

- Inscription → email de confirmation reçu et requis (confirmation activée
  sur le projet) → connexion refusée tant que non confirmé (message clair)
  → connexion acceptée après confirmation.
- Onboarding 6 étapes complété → organisation, boutique et
  `organization_members` (rôle `owner`) créés en base via
  `create_organization_with_owner`.
- Redirection automatique vers `/dashboard` après onboarding ; `/parametres`
  affiche les vraies données (organisation + profil) lues via RLS.
- Topbar affiche le nom de l'organisation et l'email réels ; déconnexion
  fonctionnelle, session bien invalidée (page protégée → redirigée vers
  `/login`).
- Reconnexion : redirection directe vers `/dashboard` (onboarding non
  représenté, comme attendu).
- Aucune erreur console ni serveur sur l'ensemble du parcours.

**Phase 2 est donc validée en conditions réelles, pas seulement en local.**

⚠️ Un compte de test (`byadigital2026+byaflow@gmail.com`) et une organisation
"BYA Flow Test" existent maintenant dans le projet Supabase réel. À supprimer
manuellement (Authentication + Table Editor) avant le lancement si vous ne
voulez pas les garder — je n'ai pas les droits pour le faire moi-même (aucune
policy de suppression définie, ni clé `service_role`).

## 2026-08-28 — Phase 3 : tableau de bord

- **Base de données** (`sql/phase3_dashboard_data.sql`) : `customers`,
  `products`, `orders`, `order_items` — schéma volontairement minimal (juste
  ce qu'il faut pour calculer les indicateurs honnêtement) ; colonnes
  complètes (variantes, images, SKU, adresses...) prévues en Phase 4/5.
  Fonctions `is_store_member()` / `is_order_member()` en `SECURITY DEFINER`,
  même logique anti-récursion RLS qu'en Phase 2.
- **Dashboard réel** (`app/(app)/dashboard/page.tsx`) branché sur ces tables :
  - 4 cartes KPI (`components/dashboard/KpiCard.tsx`) : chiffre d'affaires,
    commandes, panier moyen, nouveaux clients — 30 derniers jours.
  - Graphique d'évolution des ventes (`components/dashboard/SalesChart.tsx`,
    via `recharts`).
  - Produits les plus vendus (`components/dashboard/TopProducts.tsx`), avec
    état vide dédié.
  - Zone "BYA Flow recommande" (`components/dashboard/RecommendationsPanel.tsx`)
    : structure prête, message honnête tant qu'aucune donnée n'existe (pas de
    recommandation inventée — l'IA qui les générera arrive en Phase 11).
- Volontairement exclus de cette phase : taux de conversion (nécessite
  `analytics_events`, Phase 9) et campagnes performantes (nécessite le module
  Marketing, Phase 7) — cartes qui auraient été vides ou trompeuses sans ces
  fondations.
- Vérifié : `next build` (25 routes), `next lint` (aucune erreur).

### Validation en conditions réelles

`sql/phase3_dashboard_data.sql` exécuté sur le projet Supabase "BYA FLOW".
Testé dans le navigateur avec le compte de test existant (déjà onboardé) :
dashboard affiche honnêtement 0 € / 0 commandes / "—" panier moyen / 0
nouveaux clients, graphique des 30 derniers jours rendu (recharts), états
vides corrects pour produits et recommandations. Aucune erreur console ni
serveur. Layout desktop vérifié (grille 4 colonnes, graphique redimensionné
correctement).

## Prochaines étapes (Phase 4)

- [ ] Boutique + produits : personnalisation boutique, CRUD produits
      (variantes, images, catégories, stock, SKU), qui alimenteront enfin
      les indicateurs du dashboard avec de vraies données.
