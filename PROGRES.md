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

## 2026-08-28 — Phase 4 : boutique & produits

- **Base de données** (`sql/phase4_boutique_produits.sql`) :
  - `stores` étendue (description, logo_url, slug unique).
  - `product_categories` (par boutique).
  - `products` étendue avec toutes les colonnes du cahier des charges (slug,
    description, prix de comparaison, SKU, stock, poids, catégorie,
    métadonnées, statut draft/active/archived) ; `is_active` retiré (remplacé
    par `status`, plus précis).
  - `product_images`, `product_variants`.
  - Fonction `is_product_member()` (même logique `SECURITY DEFINER`).
  - Policies d'écriture (insert/update/delete) ajoutées sur `products` et
    toutes les nouvelles tables — première phase où l'écriture est réellement
    ouverte aux membres de l'organisation.
  - Buckets Supabase Storage `product-images` et `store-assets` (lecture
    publique, écriture réservée aux membres de la boutique via policy sur
    `storage.objects`).
- **Boutique** (`/boutique`) : formulaire réel (nom, slug, description, pays,
  devise en lecture seule, logo uploadé vers Storage, statut actif/inactif).
- **Produits** :
  - `/produits` : liste avec vignette, SKU, prix, stock, statut (badge),
    état vide dédié.
  - `/produits/nouveau` et `/produits/[id]` : formulaire partagé
    (`ProductForm`) pour la création et l'édition — slug auto-généré depuis
    le nom tant qu'il n'est pas modifié manuellement.
  - Catégories créées à la volée depuis le formulaire produit
    (`CategoryQuickCreate`).
  - Images : upload multiple vers Supabase Storage, suppression (fichier +
    ligne) depuis `/produits/[id]`.
  - Variantes : édition en tableau (nom, prix, prix comparé, SKU, stock),
    enregistrement en une fois (remplace la collection existante).
  - Suppression d'un produit avec confirmation (`window.confirm`), cascade
    SQL sur variantes/images.
- **Bug trouvé et corrigé pendant les tests** : `CategoryQuickCreate` était
  d'abord un `<form>` imbriqué dans le `<form>` du produit (HTML invalide) —
  un clic sur "Nouvelle catégorie" pouvait en réalité soumettre le formulaire
  produit et écraser son nom. Corrigé en appelant la Server Action
  directement (`startTransition`) au lieu d'un `<form>` imbriqué. Leçon à
  retenir pour toute future action rapide imbriquée dans un formulaire plus
  large.
- Vérifié : `next build` (26 routes), `next lint` (aucune erreur).

### Validation en conditions réelles

`sql/phase4_boutique_produits.sql` exécuté sur le projet Supabase "BYA FLOW".
Testé de bout en bout avec le compte existant : mise à jour boutique
(description persistée), création produit complet (prix, SKU, stock, poids,
statut), création et assignation de catégorie (après correction du bug
ci-dessus), ajout de variante (persistée), upload et suppression d'image
(fichier réellement supprimé de Storage, vérifié en dehors du cache CDN),
suppression du produit avec cascade. Dashboard revérifié : aucune régression,
"produits les plus vendus" reste vide tant qu'aucune commande n'existe
(normal, Phase 5). Aucune erreur serveur.

⚠️ Une catégorie de test "Vêtements" reste dans le projet Supabase réel (sans
produit associé) — à supprimer via Table Editor si besoin, avec le reste des
données de test déjà signalées en Phase 2.

## 2026-08-29 — Phase 5 : commandes & clients (CRM)

- **Base de données** (`sql/phase5_commandes_clients.sql`) :
  - `customers` étendue : téléphone, tags, notes, statut prospect/client.
    Montant dépensé et dernière activité volontairement **non stockés** —
    calculés à la lecture depuis `orders` pour éviter toute désynchronisation.
  - `orders` étendue : `order_number` (numérotation auto via `bigserial`),
    `payment_status` (pending/paid/refunded), `shipping_address` (jsonb),
    `notes`.
  - Policies d'écriture ouvertes sur `customers`/`orders`/`order_items`.
    Choix assumé : pas de policy de suppression sur `orders` (une commande
    s'annule via son statut, ne se supprime jamais — intégrité comptable).
- **Clients & CRM** (`/clients`) : liste avec tags, statut, montant dépensé
  et dernière commande calculés dynamiquement ; fiche client
  (`/clients/[id]`) avec informations éditables, historique des commandes,
  statistiques, suppression avec confirmation.
- **Commandes** (`/commandes`) :
  - Liste avec client, montant, statut, paiement, date.
  - `/commandes/nouvelle` : sélection ou création rapide de client
    (`CustomerQuickCreate`, appel direct de la Server Action — bug de
    formulaire imbriqué de la Phase 4 déjà évité), lignes de produits
    dynamiques (quantité plafonnée au stock côté client **et** revalidée
    côté serveur), adresse de livraison, calcul du total.
  - **Décrément de stock automatique** à la création d'une commande, avec
    blocage serveur si la quantité demandée dépasse le stock disponible.
  - `/commandes/[id]` : lignes de commande en lecture seule (volontairement
    immuables après création — une correction passe par un statut, pas une
    édition rétroactive), statut/paiement/livraison/notes modifiables.
- Vérifié : `next build` (28 routes), `next lint` (aucune erreur).

### Validation en conditions réelles

`sql/phase5_commandes_clients.sql` exécuté sur le projet Supabase "BYA FLOW".
Testé de bout en bout : création client (tags, statut, notes), création
produit, création d'une commande de 3 unités (stock 10 → 7, `order_number`
généré automatiquement à `#1`), tentative volontaire de survente (999 unités)
bloquée côté serveur avec message clair, stock resté intact après le refus.
Mise à jour de statut (`Livrée`) répercutée sur la liste des commandes.
Dashboard revérifié : le chiffre d'affaires (45 €), les commandes (1), le
panier moyen (45 €), les nouveaux clients (1) et "produits les plus vendus"
affichent désormais de vraies données — la Phase 3 s'active automatiquement
sans aucune modification, comme prévu par l'architecture en phases. Fiche
client : montant dépensé et historique corrects. Aucune erreur console ni
serveur (vérifié sur un onglet neuf).

## 2026-08-29 — Phase 7 : marketing (campagnes, promotions, paniers)

Décision prise avec le porteur de projet : la Phase 6 (CRM approfondi)
chevauchait largement le CRM déjà livré en Phase 5 ; priorité donnée
directement à la Phase 7, qui apporte de la valeur nouvelle.

- **Nettoyage** : suppression de `contacts`, `campaigns` (v1) et
  `campaign_events` — orphelines depuis la Phase 1 (RLS activée sans
  policy, donc jamais accessibles). `campaigns` recréée proprement,
  rattachée à `organizations`.
- **Campagnes** (`/campagnes`) : nom, canal (email/SMS/WhatsApp — champ prêt,
  aucun fournisseur connecté), contenu, audience ciblée par tags ou statut
  client/prospect. Envoi **simulé** : les destinataires correspondants sont
  calculés et enregistrés (`campaign_recipients`) pour l'historique, mais
  **aucun message réel n'est envoyé** — avertissement explicite affiché
  avant et après l'envoi pour ne jamais laisser croire le contraire.
- **Promotions & coupons** (`/promotions`) : coupons pourcentage/montant
  fixe, montant minimum, limite d'usage, dates de validité. Intégrés
  directement à la création de commande (`createOrder`) : validation
  complète côté serveur (existence, active, dates, limite, montant
  minimum), calcul de la remise, incrément du compteur d'usage.
- **Paniers abandonnés** (`/paniers-abandonnes`) : BYA Flow n'ayant pas de
  boutique publique, un panier se crée manuellement (devis, intérêt
  exprimé...). Statut actif/abandonné/converti, marquage de relance
  (`last_reminder_at` — l'automatisation réelle des relances est prévue en
  Phase 8), et **conversion en commande réelle** (crée la commande, décrémente
  le stock, marque le panier converti).
- Vérifié : `next build` (34 routes), `next lint` (aucune erreur).

### Validation en conditions réelles

`sql/phase7_marketing.sql` exécuté sur le projet Supabase "BYA FLOW". Testé
de bout en bout : coupon `BIENVENUE10` (10 %) créé puis appliqué à une
commande de 30 € → 27 € (remise de 3 € correcte, compteur d'usage passé à
1/∞) ; code promo invalide correctement rejeté avec message clair ; campagne
ciblant le tag `vip` envoyée (simulation) → 1 destinataire correctement
identifié (Claire Dubois) et enregistré, statut passé à "Envoyée" ; panier
créé pour Claire Dubois, relance marquée, puis converti en commande réelle
(#3) avec décrément de stock (5 → 4). Dashboard revérifié après ces trois
commandes cumulées : 87 € de chiffre d'affaires, 3 commandes, 29 € de panier
moyen, 6 unités vendues — tous les montants correspondent exactement à la
somme des commandes créées. Aucune erreur console ni serveur (vérifié sur un
onglet neuf).

## 2026-08-29 — Phase 8 : automatisations

- **Base de données** (`sql/phase8_automatisations.sql`) : `automations`
  (déclencheur/condition/action), `automation_runs` (historique
  d'exécution), `notifications` (nouvelle table réelle pour le module
  Notifications, jusqu'ici un placeholder).
- **Déclencheurs événementiels réels** — de vrais triggers Postgres, aucun
  code applicatif ne les invoque :
  - `order_created` (AFTER INSERT ON orders)
  - `order_delivered` (AFTER UPDATE ON orders, transition vers `delivered`)
  - `cart_abandoned` (AFTER UPDATE ON carts, transition vers `abandoned`)
- **Déclencheur temporel** `customer_inactive` : pas de planification
  automatique (aucun `pg_cron` activé par précaution) — s'exécute à la
  demande via un bouton "Exécuter maintenant" (RPC
  `run_customer_inactivity_check`, protégée par vérification d'appartenance
  à l'organisation).
- **Action unique** : créer une notification interne. Comme pour l'envoi de
  campagnes (Phase 7), aucun fournisseur externe n'est connecté — c'est
  explicite dans l'UI du formulaire.
- **Module Notifications** (`/notifications`) : passe de placeholder à
  contenu réel — liste, marquage lu/tout lu, badge de compteur non lu dans
  la Topbar (calculé côté serveur dans `app/(app)/layout.tsx`).
- Vérifié : `next build` (36 routes), `next lint` (aucune erreur).

### Validation en conditions réelles

`sql/phase8_automatisations.sql` exécuté sur le projet Supabase "BYA FLOW".
Testé de bout en bout :
- Automatisation "commande livrée" créée → commande #2 passée au statut
  "Livrée" via l'UI habituelle (aucun code spécifique appelé) → notification
  "Demander un avis" apparue automatiquement avec `{{order_number}}`
  correctement substitué. Badge Topbar passé à 1, retombé à 0 après lecture.
- Automatisation "commande créée" → nouvelle commande #4 → notification
  générée automatiquement, dans le bon ordre chronologique.
- Automatisation "client inactif" (1 jour) → exécution manuelle → 0
  notification créée, résultat correct (la seule cliente a commandé le jour
  même, donc pas inactive) : confirme l'absence de faux positif.
- Bug mineur trouvé pendant les tests : le champ "jours" avait `min="1"`,
  une valeur de test à `0` bloquait silencieusement la soumission (validation
  HTML5 native) — comportement correct du formulaire, pas un bug de
  l'automatisation ; juste une valeur de test invalide de ma part.
- Aucune erreur console ni serveur (vérifié sur un onglet neuf).

## Prochaines étapes (Phase 9)

- [ ] Analytics : chiffre d'affaires, conversion, évolution temporelle,
      meilleures ventes — poser les bases de `analytics_events` pour,
      entre autres, activer enfin le taux de conversion du dashboard
      (volontairement laissé de côté en Phase 3).
