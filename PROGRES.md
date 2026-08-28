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
  `ƒ` comme attendu), `next lint` (aucune erreur), test en navigateur avec un
  projet Supabase factice — protection des routes, redirections
  onboarding/login et affichage des erreurs (`fetch failed` sur backend
  inexistant) tous corrects.

⚠️ **Non vérifiable en conditions réelles pour l'instant** : aucune clé
Supabase du projet "BYA FLOW" n'a été fournie. Le code est correct et testé
contre un backend factice, mais l'inscription/connexion réelle, l'envoi
d'emails (confirmation, reset) et l'exécution de `sql/phase2_auth_multitenant.sql`
restent à valider avec le vrai projet Supabase avant de considérer la Phase 2
comme définitivement close.

## Prochaines étapes (Phase 3)

- [ ] Exécuter `sql/phase2_auth_multitenant.sql` sur le projet Supabase "BYA
      FLOW" et renseigner `.env.local` avec les vraies clés.
- [ ] Tester en conditions réelles : inscription, confirmation email,
      connexion, mot de passe oublié, onboarding complet.
- [ ] Construire le tableau de bord (chiffre d'affaires, commandes, panier
      moyen, clients, produits les plus vendus, zone "BYA Flow recommande").
