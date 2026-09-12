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

## 2026-08-29 — Phase 9 : analytics

- **Base de données** (`sql/phase9_analytics.sql`) : table `analytics_events`
  créée pour préparer le terrain (IA Phase 11, future boutique publique) —
  volontairement vide, aucun événement fictif inséré. L'essentiel des
  indicateurs analytics se calcule directement depuis
  `orders`/`order_items`/`customers`/`carts` déjà existants, sans nouvelle
  table.
- **Page `/analytics`** : sélecteur de période (7/30/90 jours, 12 mois),
  5 KPI (CA, commandes, panier moyen, nouveaux clients, **conversion**),
  graphique d'évolution (agrégation quotidienne ≤ 90 jours, mensuelle
  au-delà), répartition des commandes par statut, top 10 meilleures ventes
  (quantité + chiffre d'affaires).
- **Taux de conversion** : calculé honnêtement en panier → commande
  (`carts.status = 'converted'` / total paniers de la période), et non à
  partir d'un trafic visiteur inventé — BYA Flow n'a toujours pas de
  boutique publique pour mesurer de vraies visites. Décision cohérente avec
  celle prise en Phase 3.
- Vérifié : `next build` (36 routes), `next lint` (aucune erreur).

### Validation en conditions réelles

`sql/phase9_analytics.sql` exécuté sur le projet Supabase "BYA FLOW". Testé
sur les 4 commandes cumulées des phases précédentes : 102 € de CA (somme
exacte 45+27+15+15), 4 commandes, 26 € de panier moyen, conversion 100 %
(1/1 panier converti), répartition par statut correcte (2 Livrée, 2 En
attente), meilleure vente "Mug BYA Flow" (7 unités, 105 € — chiffre d'affaires
ligne à ligne avant remise, distinct du total commande après coupon).
Sélecteurs de période 7 jours et 12 mois testés : bornes de date et
agrégation (quotidienne / mensuelle) correctes dans les deux cas. Aucune
erreur console ni serveur (vérifié sur un onglet neuf).

## 2026-08-29 — Phase 10 : BYA Flow Score

- **Architecture évolutive** (`lib/score/calculateScore.ts`) : logique de
  calcul pure, sans accès base de données, séparée de la récupération des
  données (`lib/data/growthScore.ts`). 8 facteurs notés indépendamment sur
  0-100 puis combinés par une moyenne pondérée (poids par défaut exportés
  dans `DEFAULT_WEIGHTS`, modifiables sans toucher au reste du code) :
  évolution des ventes (20 %), conversion panier→commande (15 %), activité
  client (15 %), évolution du panier moyen (10 %), fréquence d'achat (15 %),
  paniers abandonnés (10 %), performance produits (10 %), activité
  marketing (5 %).
- Bandes de score conformes au cahier des charges : 0-30 critique, 31-50
  faible, 51-70 moyen, 71-85 bon, 86-100 excellent.
- **Page `/ia`** : jauge circulaire SVG colorée selon la bande, détail des
  8 facteurs avec leur poids, section "Opportunités de croissance"
  clairement annoncée pour la Phase 11 (pas de recommandation inventée).
- **Résumé sur le dashboard** : jauge compacte + lien vers le détail,
  réutilisant exactement la même fonction de calcul (aucune duplication de
  logique).
- Aucune nouvelle table : tout se calcule à la volée depuis
  `orders`/`order_items`/`customers`/`carts`/`campaigns` déjà existants.
- Vérifié : `next build` (36 routes), `next lint` (aucune erreur).

### Validation en conditions réelles

Testé sur les données cumulées des phases précédentes : score de **91
(Excellent)**, recalculé manuellement facteur par facteur pour vérifier la
formule — 70×20 % + 100×15 % + 100×15 % + 70×10 % + 100×15 % + 100×10 % +
100×10 % + 100×5 % = 91, exact. Jauge SVG vérifiée par inspection du DOM :
`stroke-dasharray` correspond exactement à 91 % de la circonférence, couleur
verte de la bande "excellent". Cohérence dashboard ↔ page `/ia` confirmée
(même score affiché aux deux endroits). Aucune erreur console ni serveur.

## 2026-08-29 — Phase 11 : couche IA

- **Architecture IA abstraite** (`lib/ai/`) : interface `AIProvider`
  (`lib/ai/types.ts`), fournisseur par défaut `heuristicProvider` — texte
  généré par modèles, **aucun appel externe, aucune clé API requise**,
  conformément au cahier des charges ("ne pas connecter une API IA payante
  sans nécessité"). `lib/ai/index.ts` centralise le fournisseur actif : en
  connecter un vrai (OpenAI, Anthropic...) plus tard ne demande de changer
  qu'un seul fichier.
- **Génération de descriptions produits** : bouton "Générer avec l'IA" dans
  `ProductForm`, à partir du nom/catégorie/prix déjà saisis — texte
  modifiable avant enregistrement, jamais imposé.
- **Génération de contenu de campagne** : même principe dans `CampaignForm`
  (objet + corps du message), adapté au canal choisi (email/SMS/WhatsApp).
- **Opportunités de croissance** (`lib/ai/opportunities.ts`) : moteur de
  recommandations **basé sur des règles réelles**, pas sur un modèle IA —
  3 catégories câblées sur des données existantes : client à réactiver
  (aucune commande depuis 60 jours), panier à récupérer (actif ou
  abandonné, non converti), produit à promouvoir (en stock, actif, aucune
  vente sur 30 jours). Branché à la fois sur le dashboard (panneau "BYA Flow
  recommande", jusqu'ici vide) et sur la page `/ia` (liste complète).
- Volontairement non couvert (extensions futures de la même architecture,
  cf. cahier des charges section IA) : segmentation intelligente, détection
  d'anomalies, prévisions — demandent plus d'historique de données que ce
  qui existe aujourd'hui pour être pertinents.
- Aucune nouvelle table SQL.
- Vérifié : `next build` (36 routes), `next lint` (aucune erreur).

### Validation en conditions réelles

Testé sur le projet Supabase "BYA FLOW" : génération de description produit
("Casquette BYA Flow", 19,90 €) → texte cohérent intégrant nom et prix,
modifiable, enregistré correctement. Génération de contenu de campagne
adaptée au canal SMS → texte différent de celui pour email, vérifié.
Création du produit sans vente → apparaît immédiatement comme "Produit à
promouvoir" sur le dashboard **et** sur `/ia`, cohérence confirmée entre les
deux pages. Effet de bord vérifié et exact : le BYA Flow Score est repassé
de 91 à 86 (recalculé : 70×20 %+100×15 %+100×15 %+70×10 %+100×15 %+100×10 %
+**50**×10 %+100×5 % = 86) car le facteur "Performance produits" reflète
désormais qu'un seul produit sur deux a généré une vente — la cascade entre
opportunités et score fonctionne comme prévu, aucune donnée inventée.
Aucune erreur console ni serveur.

## 2026-08-29 — Phase 12 : facturation SaaS

Aucune section dédiée dans le cahier des charges détaillé (contrairement aux
autres modules) : périmètre défini raisonnablement — 4 plans, limites
d'usage réellement appliquées, aucune passerelle de paiement (cohérent avec
"ne pas intégrer de service externe complexe sans nécessité").

- **Catalogue de plans** (`lib/billing/plans.ts`) : Free (gratuit, 10
  produits/20 commandes-mois/1 membre), Starter (19 €), Pro (49 €), Business
  (99 €, illimité) — logique pure, modifiable sans toucher au reste du code.
- **Base de données** (`sql/phase12_facturation.sql`) : table
  `subscriptions` (1 par organisation), backfill au plan gratuit pour les
  organisations déjà créées, `create_organization_with_owner()` (Phase 2)
  étendue pour créer automatiquement l'abonnement gratuit des nouvelles
  organisations.
- **Limite réellement appliquée** : la création de produit
  (`lib/actions/products.ts`) vérifie le nombre de produits existants contre
  la limite du plan avant d'insérer — pas une limite décorative, un vrai
  blocage avec message clair.
- **Page `/facturation`** : abonnement actuel avec usage réel (produits,
  commandes du mois, membres), comparatif des 4 plans, changement de plan
  immédiat et gratuit (aucun moyen de paiement connecté, explicitement
  indiqué), historique de facturation honnêtement vide.
- Vérifié : `next build` (36 routes), `next lint` (aucune erreur).

### Validation en conditions réelles

Testé sur le projet Supabase "BYA FLOW" : changement de plan Free → Starter
→ Free confirmé (limites affichées mises à jour instantanément). Limite de
10 produits du plan Free testée en conditions réelles jusqu'au bout : 8
produits de test créés pour atteindre exactement 10/10, la 11ᵉ tentative
correctement bloquée avec le message "Limite de 10 produits atteinte pour
le plan Free...", puis passage au plan Starter (limite 100) et la même
création aboutit immédiatement — la limite suit bien le plan en temps réel.
Produits de test supprimés après vérification pour ne laisser que le
catalogue réel. Aucune erreur console ni serveur.

## 2026-08-29 — Phase 13 : tests, sécurité, optimisation

Phase d'audit et de durcissement, pas de nouvelle fonctionnalité — revue
transversale de tout ce qui a été construit depuis la Phase 1.

### Sécurité

- **Audit RLS complet** : relecture de toutes les tables/policies des 9
  scripts SQL. Aucune faille trouvée ; les absences de policy (ex. pas de
  suppression sur `orders`, pas d'écriture directe sur `organization_members`
  hors RPC) sont toutes des choix déjà documentés, pas des oublis.
- **Aucun secret en dur** : recherche par pattern (clés API, `service_role`)
  et vérification de l'historique Git — rien trouvé, `SUPABASE_SERVICE_ROLE_KEY`
  n'a jamais été utilisé nulle part dans le code applicatif (seule la clé
  anon/publishable est utilisée, la RLS est l'unique frontière de sécurité).
- **2 corrections défense en profondeur** : `updateStore` et
  `uploadProductImage` faisaient confiance à un `storeId` envoyé par le
  client (dans un champ caché) pour construire des chemins/filtres. La RLS
  empêchait déjà toute exploitation réelle (une tentative sur la boutique
  d'une autre organisation aurait été bloquée ou n'aurait touché aucune
  ligne), mais l'identifiant est désormais toujours dérivé côté serveur
  (`getCurrentStore()` / lecture du produit) plutôt que du client.
- **Validation serveur renforcée** : prix/stock/poids de produit revalidés
  non négatifs côté serveur (le `min="0"` HTML seul ne protège pas d'une
  requête forgée) ; pourcentage de coupon plafonné à 100 (testé en
  conditions réelles avec une tentative à 500 %, correctement ramenée à
  100 % avant écriture en base).
- **2 erreurs auparavant non vérifiées, corrigées** : l'insertion des
  lignes de commande lors de la conversion d'un panier, et l'enregistrement
  des destinataires avant de marquer une campagne "envoyée", ignoraient
  silencieusement leurs erreurs — une campagne aurait pu être marquée
  envoyée avec zéro destinataire réellement enregistré en cas d'échec.

### Performance

- **Pagination réelle** ajoutée sur `/produits`, `/commandes`, `/clients`
  (25 par page, `components/ui/Pagination.tsx`, `lib/pagination.ts`) — ces
  listes n'avaient aucune limite avant et auraient chargé un nombre illimité
  de lignes. La page clients a aussi été corrigée pour ne plus charger
  *toutes* les commandes de la boutique afin de calculer le montant dépensé,
  seulement celles des clients affichés sur la page courante.
- Non traité (accepté comme dette raisonnable, volumes attendus faibles) :
  campagnes, promotions, paniers abandonnés, automatisations.

### Tests

- **Suite de tests unitaires** introduite (`vitest`, `npm test`) pour la
  logique pure sans dépendance base de données : `lib/score/calculateScore.ts`
  (score exact 91 puis 86 rejoué depuis les vraies valeurs vérifiées en
  Phase 10/11, bornes 0-100, bandes), `lib/billing/plans.ts` (catalogue,
  fallback), `lib/utils.ts` (`slugify`). 14 tests, tous verts.
- Non couvert (dette assumée) : tests d'intégration/E2E nécessiteraient une
  base de test dédiée et une infrastructure plus lourde, hors du périmètre
  raisonnable de cette phase.

### Dette connue, documentée volontairement plutôt que corrigée en douce

- La barre de recherche de la Topbar (présente depuis la Phase 1) ne fait
  toujours rien — jamais câblée à une fonctionnalité. Signalé ici plutôt
  que laissé comme un détail invisible.
- Aucune UI d'invitation d'équipe n'existe encore : `organization_members`
  n'a pas de policy d'écriture directe hors RPC de création d'organisation,
  ce qui est correct tant que cette fonctionnalité n'existe pas.

Vérifié : `next build` (36 routes), `next lint` (aucune erreur), `npm test`
(14/14). Testé en conditions réelles sur le projet Supabase "BYA FLOW" :
mise à jour boutique, upload d'image produit et coupon à 500 % ramené à
100 % — tous confirmés fonctionnels après les corrections. Aucune régression
sur le dashboard (score et données inchangés). Aucune erreur console ni
serveur.

## 2026-08-29 — Phase 14 : préparation production

Dernière phase du cahier des charges (14/14).

- **En-têtes de sécurité HTTP** ajoutés (`next.config.js`) :
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (caméra/micro/géolocalisation désactivés). Confirmés
  présents en direct via `fetch()` sur la page réelle.
- **Favicon** (`app/icon.svg`) : n'existait pas jusqu'ici (vérifié absent
  depuis la Phase 1). Créé cohérent avec l'identité visuelle existante
  (couleur `brand-600`, initiale "B", même esprit que l'avatar de la
  Topbar). Confirmé servi correctement (`content-type: image/svg+xml`).
- **`.env.example` nettoyé** : `SUPABASE_SERVICE_ROLE_KEY` retirée — jamais
  utilisée nulle part dans le code (confirmé en Phase 13), la laisser
  n'aurait fait qu'inviter à créer un secret sensible sans besoin réel.
- **`package.json`** : `engines.node` ajouté pour des builds Vercel
  reproductibles.
- **README** : section "Déploiement (Vercel)" complète — étapes précises,
  variables d'environnement à renseigner en production, et le rappel
  important de mettre à jour les "Redirect URLs" dans Supabase Auth après
  déploiement (sans quoi les liens de confirmation d'inscription et de
  réinitialisation de mot de passe redirigeraient vers `localhost`).
- Vérifié : `next build` (37 routes dont `/icon.svg`), `next lint`,
  `npm test` (14/14). Aucune erreur console/serveur.

⚠️ **Ce que je n'ai pas pu faire moi-même** : je n'ai pas d'accès au compte
Vercel, donc je n'ai pas pu créer/connecter le projet `bya-flow` ni
renseigner les variables d'environnement en production — ces étapes sont
documentées dans le README mais restent à réaliser côté Vercel/Supabase par
le porteur de projet.

---

**Les 14 phases du cahier des charges sont closes.** BYA Flow est un SaaS
de croissance commerciale fonctionnel de bout en bout : authentification
multi-tenant, boutique/produits, commandes/clients, marketing (campagnes,
coupons, paniers abandonnés), automatisations réelles (triggers Postgres),
analytics, BYA Flow Score, couche IA (architecture abstraite + opportunités
de croissance basées sur des règles réelles), facturation SaaS avec limites
réellement appliquées, et une base de code auditée (RLS, secrets,
validation, pagination, tests). Chaque phase a été testée en conditions
réelles sur le projet Supabase "BYA FLOW", pas seulement en local.

Pistes pour la suite (hors cahier des charges initial, à prioriser avec le
porteur de projet) : invitation d'équipe (UI manquante), recherche Topbar
fonctionnelle, boutique publique (nécessaire pour de vrais paniers
abandonnés et un vrai taux de conversion visiteur), intégration d'un
véritable fournisseur IA (remplacer `heuristicProvider`), intégration d'un
vrai fournisseur email/SMS/WhatsApp pour les campagnes, passerelle de
paiement pour la facturation SaaS, `pg_cron` pour l'automatisation
réellement planifiée du déclencheur "client inactif".

## 2026-08-29 — Mise en production réelle

Après la clôture des 14 phases, l'application a été réellement déployée
sur Vercel (`https://bya-flow.vercel.app`), connectée au projet Supabase
"BYA FLOW" — trois problèmes de configuration (pas de code) ont été
diagnostiqués et corrigés en direct avec le porteur de projet :

- **Output Directory** réglé sur `public` dans Vercel (config héritée d'un
  import initial mal détecté), au lieu du défaut Next.js → tous les
  déploiements échouaient depuis la Phase 7 sans que personne ne le sache.
- **`NEXT_PUBLIC_SUPABASE_URL`** contenait une faute de frappe (`.com` au
  lieu de `.co`) → le middleware plantait sur chaque requête
  (`MIDDLEWARE_INVOCATION_FAILED`).
- Une fois corrigés : inscription, email de confirmation Supabase Auth,
  connexion et onboarding complet (6 étapes) testés de bout en bout en
  production avec un vrai compte, tous fonctionnels.

## 2026-08-29 — Phase 15 : Admin Plateforme

Chantier demandé après la mise en production, en dehors du cahier des
charges initial : le porteur de projet (BYA Digital, opérateur de la
plateforme) n'avait aucune vue transverse sur les organisations clientes
créées via l'onboarding — chaque organisation étant isolée par RLS, y
compris pour lui.

- **`sql/phase15_admin_plateforme.sql`** : colonne
  `profiles.is_platform_admin` (false par défaut), fonction
  `is_platform_admin()` (SECURITY DEFINER), et policies de lecture
  cross-tenant sur `organizations`, `organization_members`, `stores` et
  `subscriptions` — plus une policy d'écriture sur `subscriptions` pour
  changer le plan d'un client en support manuel. **Volontairement limité**
  aux données de pilotage commercial (organisations, plans, effectifs) —
  pas d'accès aux données métier de chaque client (produits, commandes,
  clients), pour respecter l'isolation même côté opérateur.
- **Aucune UI n'accorde ce rôle** (décision délibérée pour qu'un client ne
  puisse jamais se l'auto-attribuer) : accordé uniquement par une requête
  SQL manuelle, documentée dans le README.
- **`/admin-plateforme`** : cartes de synthèse (nombre de clients, de
  boutiques, MRR estimé à partir des plans réellement actifs, plan le plus
  utilisé), et liste des organisations avec date de création, nombre de
  membres/boutiques et changement de plan en un clic. Double protection :
  policy RLS + vérification serveur (`notFound()` si le compte n'est pas
  admin plateforme) — le lien n'apparaît dans la barre latérale que pour un
  compte autorisé.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous propres.
  Vérification visuelle complète du parcours (page invisible/404 pour un
  compte normal) à faire une fois le rôle accordé en production.

## 2026-08-29 — Intégration du logo officiel

Le logo officiel BYA Flow (fourni par le porteur de projet) n'était utilisé
nulle part dans l'application — seule sa palette de couleurs avait été
reprise. Trois exports générés à partir du fichier source (monogramme
recadré, badge carré arrondi, lockup complet) :

- **Favicon** (`app/icon.png`) : remplace le favicon dessiné à la main de
  la Phase 14.
- **`public/logo-mark.png`** : badge utilisé dans la barre latérale, le
  header de la page publique et l'en-tête des pages d'authentification.
- **`public/logo-full.png`** : lockup complet (icône + "BYA FLOW" +
  tagline), utilisé en visuel de la page d'accueil publique.

**Bug réel trouvé et corrigé en marge** : le `matcher` du middleware
protégeait toutes les routes non explicitement publiques, y compris les
fichiers statiques comme `/logo-mark.png` — un visiteur non connecté qui
chargeait la page de connexion se faisait rediriger vers `/login` en
tentant de charger l'image (boucle silencieuse, image cassée). Corrigé en
excluant les fichiers statiques (`png`, `jpg`, `svg`, etc.) du matcher,
plutôt que d'énumérer chaque asset un par un dans `PUBLIC_PATHS`. Vérifié
en navigateur, déconnecté, sur `/`, `/login` et `/signup`.

## 2026-08-29 — Nouveau cahier des charges : BYA Flow e-commerce complet

Brief maître reçu élargissant la vision : BYA Flow doit devenir une
plateforme e-commerce complète à 3 expériences (**Admin** BYA Digital,
**Business** commerçant, **Shop** client final), avec un vrai parcours
d'achat public (boutique → produit → panier → checkout → paiement →
commande → livraison → fidélisation). Développement replanifié en 30
phases. Périmètre confirmé inchangé : uniquement `BYA-Flow` /
`bya-digital/bya-flow` / Vercel `bya-flow` / Supabase `BYA FLOW`.

### Audit complet avant toute modification

- **Git** : arbre propre, remote `bya-digital/bya-flow` confirmé, historique
  intact.
- **Vercel/Next.js** : configuration saine (`next.config.js` correct,
  aucun `vercel.json` figeant un mode statique). Le seul vrai problème
  trouvé — Output Directory réglé sur `public` côté dashboard Vercel,
  qui faisait échouer silencieusement tous les déploiements depuis
  plusieurs semaines — a été corrigé en direct avec le porteur de projet
  le 2026-08-29, avant ce brief.
- **Supabase / RLS** : 23 tables, RLS activée sur la totalité (vérifié
  programmatiquement, aucune exception). Isolation multi-tenant par
  `organization_id`/`store_id` via des fonctions `SECURITY DEFINER`,
  cohérente sur tout le schéma.
- **Fonctionnalités réelles vs simulées** : le cœur (auth, onboarding,
  boutique/produits/commandes/clients, automatisations réelles,
  facturation avec limites appliquées) fonctionne réellement. Les zones
  volontairement non branchées (envoi de campagnes, paiements, IA
  générative) sont documentées comme telles dans le code, jamais
  présentées comme opérationnelles. `/audit` (Sécurité & audit) reste un
  placeholder.
- **Trou principal confirmé** : aucune route d'achat public n'existe
  (`/store/[slug]`, panier, checkout, compte client) — exactement le
  constat du nouveau brief (section 6/70).
- **Bonne surprise** : le schéma Phase 4 avait déjà anticipé une partie du
  terrain — `stores.slug` (unique, backfillé), `stores.is_active`,
  `products.slug` (unique par boutique) et `products.status`
  (`draft`/`active`/`archived`) existent déjà. Le Store Builder et la
  boutique publique (Phases 3-4 du nouveau plan) pourront s'appuyer
  dessus sans migration de rattrapage.

### Phase 1 (nouveau plan) — Correction socle

Conclusion de l'audit : **aucune correction destructive ou corrective
n'est nécessaire**. Le socle technique (Git, Vercel, Next.js, schéma
Supabase, RLS) est déjà sain. Phase 1 est donc close sans changement de
code.

## 2026-08-29 — Phases 4-5 (nouveau plan) : boutique publique + catalogue

Décision du porteur de projet : sauter directement à la boutique
publique plutôt que suivre l'ordre strict du plan (Design System d'abord).
Construit en un seul chantier cohérent : accueil boutique + fiche produit
publics, sans encore panier/checkout (Phases 6-7, volontairement pas
commencées — pas de bouton d'achat qui ne ferait rien).

- **`sql/phase16_boutique_publique.sql`** :
  - **Bug réel trouvé pendant cette phase** : `lib/actions/onboarding.ts`
    crée une boutique sans jamais renseigner `slug` — seules les
    boutiques existant au moment du rattrapage ponctuel de la Phase 4
    avaient un slug. Toute boutique créée depuis (dont le compte de test
    utilisé pour vérifier cette phase) avait `/store/` cassé. Corrigé par
    un trigger `set_store_slug` (protège tout futur point d'insertion, pas
    seulement l'onboarding) + rattrapage des lignes existantes + contrainte
    `not null`, sur le même modèle que `products.slug` en Phase 4.
  - Policies RLS de lecture anonyme, volontairement limitées : une
    boutique n'est visible que si `is_active = true`, un produit que si
    `status = 'active'` **et** sa boutique publiée. Rien d'autre
    (organisation, clients, commandes) n'est concerné.
- **`lib/data/publicStore.ts`** : lecture anonyme (`getPublicStoreBySlug`,
  `getPublicProducts`, `getPublicProductBySlug`), séparée de
  `lib/data/store.ts` qui reste réservé aux membres authentifiés.
- **`app/store/[slug]/`** : layout dédié (header/footer boutique, sans la
  barre latérale de l'app), page d'accueil (grille produits, prix barré,
  rupture de stock) et fiche produit (galerie, description, variantes).
  404 propre si la boutique ou le produit n'est pas publié.
- **`middleware.ts`** : `/store/*` ajouté aux chemins publics (accès
  anonyme, pas de garde onboarding).
- **`/boutique`** : nouveau badge de statut ("Boutique publiée" /
  "Boutique non publiée") + lien direct "Voir ma boutique publique" ; le
  champ existant "Boutique active" reclarifié pour indiquer qu'il contrôle
  cette visibilité publique.
- **Volontairement absent** : aucun bouton "Ajouter au panier" — un
  encart explique que l'achat en ligne arrive dans une prochaine étape,
  plutôt que d'afficher un bouton qui ne ferait rien.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous propres.
  Vérification visuelle en direct à faire une fois la migration SQL
  exécutée (le bug de slug n'était pas visible avant cette phase, aucune
  boutique existante n'avait encore été testée via son URL publique).

**Vérifié en production le 2026-08-29** : migration appliquée, slug de
boutique corrigé (`bya-flow-test-boutique-9b1eba86`), accès anonyme
confirmé (onglet jamais connecté), état vide honnête si aucun produit,
404 propre pour une boutique inexistante.

## 2026-08-29 — Phase 6 (nouveau plan) : panier

Un visiteur de la boutique publique n'a pas de compte (Phase 9, pas
encore construite). Pour qu'il retrouve son panier d'une page à l'autre
sans compte, le middleware ouvre désormais une **session Supabase
anonyme** dès qu'un visiteur atteint `/store/*` sans session — un vrai
`auth.uid()` stable (cookie), sans créer de fiche client CRM.

- **`sql/phase17_panier.sql`** : colonne `carts.anon_user_id` (référence
  `auth.users`), un panier actif au maximum par visiteur et par boutique
  (index unique partiel), policies RLS dédiées (`is_cart_owner_anon`,
  même schéma que `is_cart_member` de la Phase 7) limitant strictement
  un visiteur à son propre panier. ⚠️ Nécessite d'activer "Allow
  anonymous sign-ins" dans Supabase Authentication → Settings avant
  exécution, sans quoi la création de session anonyme échoue.
- **`lib/data/publicCart.ts`** / **`lib/actions/publicCart.ts`** :
  lecture du panier + actions `addToCart`, `updateCartItemQuantity`,
  `removeCartItem`. Le stock est revérifié côté serveur à chaque ajout
  et modification de quantité (jamais seulement côté client).
- **`app/store/[slug]/panier/page.tsx`** : liste des articles, quantité
  modifiable, retrait, sous-total. Réutilise `unit_price` capturé à
  l'ajout (le panier n'est pas affecté si le commerçant change le prix
  du produit ensuite).
- **Fiche produit** : le bouton "Ajouter au panier" (précédemment un
  encart "bientôt disponible") est maintenant réellement fonctionnel,
  avec vérification de stock.
- **En-tête boutique** : icône panier avec compteur d'articles.
- **Volontairement absent** : pas de bouton "Passer commande" — un
  encart indique honnêtement que le paiement arrive dans une prochaine
  étape (Phase 7 : checkout), plutôt que d'afficher un bouton inerte.
  Pas de fusion panier invité/compte client non plus : elle n'a de sens
  qu'une fois la Phase 9 (compte client) construite.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous propres.
  Vérification en conditions réelles (anonyme, ajout/modif/retrait) à
  faire une fois la migration exécutée et l'auth anonyme activée côté
  Supabase.

**Vérifié en production le 2026-08-29** : panier testé de bout en bout en
visiteur anonyme réel (nouvel onglet jamais connecté) — ajout depuis la
fiche produit, modification de quantité avec recalcul du sous-total,
retrait, badge du compteur synchronisé dans l'en-tête à chaque action.

## 2026-08-29 — Phases 7-8 (nouveau plan) : checkout + commande publique

Transformer un panier en vraie commande implique plusieurs écritures
liées (client CRM, commande, lignes, décrément de stock, panier marqué
"converti") qui doivent réussir ou échouer ensemble. Plutôt que d'ouvrir
des policies RLS d'écriture anonymes sur 4 tables différentes, tout passe
par une seule fonction `checkout_cart()` SECURITY DEFINER — même principe
que `create_organization_with_owner()` de la Phase 2 : la fonction
vérifie elle-même que l'appelant possède le panier (`anon_user_id =
auth.uid()`) avant d'écrire quoi que ce soit, et revalide le stock et le
statut des produits au moment du checkout (pas seulement à l'ajout au
panier).

- **`sql/phase18_checkout.sql`** : colonne `orders.cart_id` (traçabilité
  + scoping RLS), fonction `checkout_cart()` (client CRM retrouvé par
  email ou créé, commande + lignes insérées, stock décrémenté, panier
  marqué `converted`, le tout dans une seule transaction — un échec à
  n'importe quelle étape annule tout), et policies de lecture pour que
  le client anonyme puisse revoir sa propre commande juste après
  l'avoir passée.
- **La commande produite est une vraie commande** : elle apparaît
  immédiatement dans `/commandes` côté commerçant, avec le même format
  d'adresse de livraison que les commandes créées manuellement — aucun
  système parallèle.
- **`app/store/[slug]/checkout/page.tsx`** : coordonnées, adresse de
  livraison, récapitulatif du panier. Redirige vers `/panier` si le
  panier est vide (pas de checkout sur rien).
- **`app/store/[slug]/commande/[orderId]/page.tsx`** : confirmation avec
  numéro de commande, articles, adresse, total.
- **Paiement volontairement absent** : la commande est créée avec
  `payment_status = 'pending'`, jamais `'paid'` — la page de confirmation
  indique clairement que la boutique contactera le client pour le
  règlement, plutôt que de simuler un paiement réussi (Phase 11, pas
  commencée : nécessite un vrai fournisseur).
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous propres.
  Vérification en conditions réelles à faire une fois la migration
  exécutée.

**Vérifié en production le 2026-08-29** : parcours complet testé en
visiteur anonyme réel — ajout au panier, checkout, commande n°5 créée.
Confirmé côté commerçant : commande visible dans `/commandes` (statuts
"En attente"/"En attente", jamais "payé"), client CRM créé
automatiquement (email, téléphone, statut, montant dépensé), stock
décrémenté (19 → 18).

## 2026-08-29 — Phase 9 (nouveau plan) : compte client

Un client peut désormais créer un vrai compte (email/mot de passe, même
mécanisme que les comptes marchands) pour retrouver son historique de
commandes d'une visite à l'autre — jusqu'ici chaque visite anonyme était
indépendante.

- **`sql/phase19_compte_client.sql`** : aucune nouvelle colonne. L'accès
  "c'est à moi" se fait via `auth.email()` comparé à `customers.email` —
  la même adresse qui sert déjà à retrouver/créer le client au moment du
  checkout invité (Phase 18). Un visiteur anonyme n'a pas d'email, donc
  ces policies ne lui donnent naturellement aucun accès.
- **Fusion panier invité → panier du compte** (`merge_cart()`) : se
  connecter change l'identité de session (l'ancien panier anonyme
  deviendrait sinon inaccessible). Le panier d'avant connexion est lu
  côté serveur juste avant l'appel de connexion, puis fusionné dans le
  panier du compte (quantités additionnées si un même produit est dans
  les deux) juste après.
- **`app/store/[slug]/compte/`** : inscription, connexion, tableau de
  bord ("Bonjour {prénom}" + historique de commandes), détail d'une
  commande. Confirmation par email requise à l'inscription (même
  parcours que les comptes marchands, déjà vérifié en production).
- **Checkout adapté** : un client connecté voit son email pré-rempli
  (verrouillé, pour que la commande soit bien rattachée à son compte) et
  son nom pré-rempli mais modifiable.
- **En-tête boutique** : icône compte à côté du panier.
- **Volontairement limité à cette phase** : la fusion panier ne
  fonctionne qu'à la **connexion** (session synchrone, testable
  directement) — pas encore à l'inscription initiale, qui nécessite de
  passer par la confirmation email avant que la session change
  réellement ; le panier du visiteur reste intact en attendant et sera
  repris à sa première connexion réelle. Pas d'adresses enregistrées, de
  favoris ni de fidélité (Phases 12+, pas commencées).
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous propres.
  Vérification en conditions réelles (inscription email/mot de passe
  soumise à confirmation par email, non automatisable ici) à faire par
  le porteur de projet.

**Vérifié en production le 2026-08-29** : inscription confirmée par
email, connexion réussie, fusion du panier invité confirmée (produit
ajouté avant connexion retrouvé dans le panier du compte après),
isolation confirmée (aucune commande d'un autre client visible), email
verrouillé au checkout pour un compte connecté.

## 2026-08-29 — Phase 10 (nouveau plan) : livraison

Architecture volontairement simple pour cette phase : des méthodes de
livraison à plat (nom, prix, seuil de gratuité optionnel) plutôt que des
zones géographiques ou des transporteurs — l'essentiel (le client choisit
une option, son prix s'ajoute réellement au total) fonctionne, sans
sur-construire une gestion de zones qui n'a pas encore d'utilité prouvée.

- **`sql/phase20_livraison.sql`** : table `shipping_methods` (nom,
  description, prix, `free_above` optionnel, actif/inactif), lecture
  anonyme des méthodes actives d'une boutique publiée (même principe que
  les produits). `checkout_cart()` étendue avec `p_shipping_method_id`
  (optionnel, pour rester compatible) — le coût est **recalculé
  côté serveur** à partir du prix réel de la méthode et du sous-total du
  panier, jamais fait confiance à un montant envoyé par le client.
  `orders` gagne `subtotal`, `shipping_method_name` (figé, comme
  `unit_price` sur les lignes de commande) et `shipping_cost`.
- **`/livraison`** (commerçant) : CRUD complet des méthodes de livraison,
  même structure que Promotions & coupons.
- **Checkout public** : sélection de la méthode de livraison (radios avec
  prix, "Gratuite" si le seuil est atteint) ; le sous-total et le détail
  de la livraison sont maintenant affichés séparément sur la
  confirmation de commande, le détail commande du compte client et le
  détail commande côté commerçant.
- **Rétrocompatible** : une boutique sans méthode configurée garde un
  checkout fonctionnel (livraison gratuite implicite, comme avant cette
  phase).
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous propres.
  Vérification en conditions réelles à faire une fois la migration
  exécutée.

**Bug réel trouvé et corrigé en marge** : `middleware.ts` traitait une
session anonyme (Phase 6, `auth.uid()` sans email) comme "déjà connecté"
sur les routes marchand — un visiteur qui avait simplement parcouru la
boutique publique ne pouvait plus atteindre `/login` normalement
(redirigé vers `/dashboard` puis `/onboarding`, sans organisation).
Corrigé en distinguant explicitement une session réelle (`user.email`
présent) d'une session anonyme pour toute la logique de garde de
l'espace marchand.

## 2026-08-29 — Terrain préparé pour les paiements (multi-fournisseur)

Décision du porteur de projet : ne pas encore intégrer un vrai
fournisseur de paiement, mais préparer l'architecture pour huit
fournisseurs d'Afrique de l'Ouest (Orange Money, Wave, MTN Mobile Money,
Moov Money, Chariow, Maketou, iKeepay, Kkiapay). **Aucune vraie API n'est
connectée** — conforme à la règle du cahier des charges de ne jamais
simuler un paiement comme s'il était réel.

- **`lib/payments/`** : interface `PaymentProvider` abstraite (même
  principe que `lib/ai/` pour la couche IA), un `stubProvider` factorisé
  (pas de duplication entre les 8 fournisseurs) dont `isConfigured()` et
  les champs de formulaire fonctionnent réellement, mais dont
  `initiate()`/`checkStatus()` renvoient explicitement "pas encore
  connecté" plutôt que de faire semblant de réussir. Brancher un vrai
  fournisseur plus tard = remplacer une entrée du registre
  (`lib/payments/index.ts`) par une vraie implémentation, sans toucher
  au reste de l'application.
- **`sql/phase21_paiements.sql`** : `payment_providers` (config par
  boutique, un identifiant marchand chacun — jamais de données bancaires
  de client), `payment_transactions` (prête à recevoir de vraies
  transactions le jour venu). Le checkout public n'utilise pas encore
  ces tables.
- **`/paiements`** (commerçant) : une carte par fournisseur, formulaire
  de clés API en écriture seule (jamais renvoyées au navigateur une fois
  enregistrées — un champ vide au ré-enregistrement conserve la valeur
  existante), activation bloquée tant que tous les champs requis ne sont
  pas renseignés. Un encart rappelle explicitement qu'aucun paiement
  n'est encore traité.
- **Champs de configuration volontairement génériques** (clé
  publique/privée/secrète) — à vérifier contre la documentation
  officielle de chaque fournisseur au moment de l'intégration réelle,
  jamais inventés comme s'ils étaient exacts.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous propres.

## 2026-08-29 — Phase 3 (nouveau plan) : Store Builder

Architecture volontairement simple : un jeu de champs fixes sur la
boutique (hero, couleur d'accent, réseaux sociaux, footer) plutôt qu'un
système de sections/blocs entièrement libre — évite de construire un
page builder complexe sans utilité prouvée, tout en couvrant les
besoins réels de personnalisation d'une vitrine. Sert directement
l'objectif "faire vendre une boutique" (une vitrine générique convertit
moins bien qu'une vitrine à l'image du commerçant).

- **`sql/phase22_store_builder.sql`** : nouveaux champs sur `stores`
  (hero_title/subtitle/image/cta, accent_color, réseaux sociaux, footer
  text), tables `store_testimonials` et `store_faqs` (listes dynamiques,
  même principe que les méthodes de livraison), lecture anonyme des
  entrées actives d'une boutique publiée.
- **`/boutique/apparence`** : bannière (image, titre, sous-titre, texte
  du bouton), couleur d'accent, réseaux sociaux, pied de page.
- **`/boutique/temoignages`** et **`/boutique/faq`** : CRUD complet,
  même structure que Promotions & coupons.
- **Boutique publique** : bannière affichée en haut de la page d'accueil
  (si configurée), sections témoignages et FAQ en bas, réseaux sociaux
  et texte personnalisé dans le pied de page. La couleur d'accent
  s'applique aux boutons de conversion clés (ajouter au panier, passer
  commande, confirmer la commande) via une variable CSS posée une fois
  dans le layout — pas de duplication de logique de couleur par page.
- **Rétrocompatible** : sans configuration, la boutique publique se
  comporte exactement comme avant cette phase (pas de bannière ni de
  sections vides affichées, couleur BYA Flow par défaut).
- **Bug trouvé pendant cette phase** : une chaîne `select(...)`
  construite par concaténation (`"a, b" + "c, d"`) empêche Supabase de
  déduire le type de la ligne retournée (`GenericStringError`), même si
  la requête fonctionne à l'exécution — corrigé en n'écrivant plus ces
  chaînes qu'en un seul littéral, dans `lib/data/publicStore.ts` et
  `lib/data/store.ts`.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous propres.
  Vérification en conditions réelles à faire une fois la migration
  exécutée.

## 2026-08-29 — Phase 12 (nouveau plan) : avis clients & favoris

Renforce la confiance (preuve sociale) et le retour des clients, dans la
continuité directe du Store Builder — les témoignages sont saisis par le
commerçant, les avis sont désormais écrits par de vrais clients.

- **`sql/phase23_avis_favoris.sql`** : table `product_reviews` avec la
  règle métier explicitement vérifiée — un client ne peut noter qu'un
  produit qu'il a réellement acheté (commande non annulée à son email).
  Cette vérification traverse plusieurs tables qu'un client ne peut pas
  toutes lire directement, donc passe par une fonction SECURITY DEFINER
  `submit_review()` (même principe que `checkout_cart()`), jamais par une
  policy d'insertion directe. Table `wishlist_items`, scoping par
  `auth.email()` comme le reste du compte client — exige donc un vrai
  compte (pas de fusion panier-invité ici, choix assumé pour rester
  simple).
- **Fiche produit** : note moyenne + liste des avis, formulaire visible
  uniquement pour un client ayant acheté ce produit (peut aussi modifier
  son propre avis), bouton favori.
- **`/avis`** (commerçant) : modération (masquer/afficher) et réponse
  publique à chaque avis, par produit.
- **`/store/[slug]/compte/favoris`** : liste des favoris du compte
  connecté ; bouton favori également sur la grille de la page d'accueil.
- **Volontairement absent** : pas de photo dans les avis, pas de
  signalement, pas de notification de retour en stock/baisse de prix
  (Phase 25+, pas commencée) — hors scope de cette phase.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous propres.
  Vérification en conditions réelles à faire une fois la migration
  exécutée.

## 2026-08-29 — Phase 24 : référencement (SEO) de la boutique publique

Aucune migration SQL pour cette phase — uniquement des métadonnées et du
code, la boutique publique existante (Phases 4-12) fournit déjà toutes
les données nécessaires.

- **`app/layout.tsx`** : métadonnées racine corrigées (elles décrivaient
  encore l'ancien positionnement « plateforme de marketing » avant le
  repositionnement AI Commerce Growth OS), `metadataBase` ajouté (via
  `NEXT_PUBLIC_SITE_URL`, repli sur `https://bya-flow.vercel.app`),
  gabarit de titre `%s — BYA Flow`.
- **`app/store/[slug]/page.tsx`** : `generateMetadata()` (titre,
  description, canonical, Open Graph, Twitter Card) à partir des
  champs de la boutique ; JSON-LD `Store`.
- **`app/store/[slug]/produits/[productSlug]/page.tsx`** :
  `generateMetadata()` par produit ; JSON-LD `Product` avec `Offer`
  (prix, devise, disponibilité selon le stock) et `AggregateRating`
  quand le produit a des avis (réutilise directement les données de la
  fonctionnalité Avis clients de la phase précédente).
- **`app/robots.ts`** : autorise l'exploration de `/store/*` (vitrine
  publique), bloque tout le reste (espace commerçant, compte client,
  panier, checkout).
- **`app/sitemap.ts`** : liste dynamiquement toutes les boutiques actives
  et leurs produits actifs (nouvelles fonctions
  `getAllActiveStoreSlugs()` / `getAllActiveProductSlugs()` dans
  `lib/data/publicStore.ts`).
- Vérifié : `next build` (confirmé `/robots.txt` et `/sitemap.xml`
  générés), `next lint`, `npm test` (14/14) tous propres. Vérification
  en conditions réelles à faire une fois le déploiement effectué
  (aucune migration à exécuter au préalable pour cette phase).
- **Bug trouvé en conditions réelles** : `/robots.txt` et `/sitemap.xml`
  n'étaient pas dans `PUBLIC_PATHS` du middleware d'authentification,
  qui les redirigeait donc vers `/login` (307) — invisibles pour tout
  moteur de recherche malgré leur ajout. Corrigé en les ajoutant à la
  liste des chemins publics ; revérifié en direct, 200 sur les deux.

## 2026-08-30 — Phase 25 : équipe & permissions

Remplit la moitié « contrôle des accès » du module Sécurité & audit
(`/audit` reste un placeholder pour la moitié « journal d'activité »,
hors scope cette phase — traitement séparé prévu plus tard).

- **`sql/phase25_equipe_permissions.sql`** : `profiles.email` ajouté
  (synchronisé automatiquement à l'inscription, backfillé pour les
  comptes existants) — nécessaire pour afficher l'équipe puisque
  `auth.users` n'est jamais lisible côté client. Nouvelle table
  `organization_invitations` (email, rôle `admin`/`member`, jeton
  unique, statut). Un admin/propriétaire crée une invitation par une
  policy d'insertion directe (`is_org_admin()`) ; **aucun envoi
  d'email réel** — le principe déjà retenu pour SMS/paiements
  s'applique ici aussi : l'invitation produit un lien
  `/rejoindre/[jeton]` que le commerçant partage lui-même par le
  canal de son choix, jamais une fausse confirmation d'email envoyé.
  Acceptation via `accept_organization_invitation()` (SECURITY
  DEFINER) : vérifie que l'email du compte connecté correspond
  exactement à l'email invité avant d'ajouter la personne à
  `organization_members` — même principe de vérification serveur que
  `submit_review()`. Nouvelles policies sur `organization_members`
  (modification de rôle / retrait, jamais sur la ligne du
  propriétaire) et fonction `shares_organization_with()` pour que les
  coéquipiers puissent voir le nom/email les uns des autres sans
  ouvrir `profiles` à tout le monde.
- **`/equipe`** (nouvelle page, section Paramètres) : formulaire
  d'invitation, liste des invitations en attente (annulables), liste
  des membres avec changement de rôle et retrait. Accès réellement
  contrôlé côté serveur (`notFound()` pour un simple membre, pas
  seulement un lien caché dans le menu) — lien du menu lui-même
  masqué pour les membres.
- **`/rejoindre/[jeton]`** (nouvelle page publique) : aperçu de
  l'invitation (organisation, rôle proposé), connexion ou création de
  compte si nécessaire (le paramètre `redirect` a été ajouté à
  l'inscription, sur le même principe que la connexion), puis
  acceptation en un clic.
- **Limite assumée** : un compte qui accepte une invitation alors
  qu'il appartient déjà à une autre organisation se retrouve membre
  des deux, mais l'espace marchand n'en affiche qu'une seule (limite
  actuelle du modèle à une organisation par session) — transfert de
  propriété et bascule multi-organisation non traités cette phase.
  Pas d'expiration des invitations (annulation manuelle uniquement).
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres.
- **Deux bugs trouvés et corrigés en conditions réelles** : (1) le
  lien `/rejoindre/[jeton]` n'était affiché nulle part sur `/equipe`
  après création d'une invitation — désormais copiable directement
  sous chaque invitation en attente ; (2) la liste des membres était
  toujours vide — `organization_members` et `profiles` référencent
  tous deux `auth.users` (jamais l'un l'autre), donc l'embed
  PostgREST `profiles(...)` ne pouvait pas être déduit automatiquement
  (pas de clé étrangère directe) et échouait silencieusement ;
  remplacé par deux requêtes jointes côté code.
- **Vérifié en direct de bout en bout** : invitation créée depuis
  `/equipe` (propriétaire) → lien copié → ouvert déconnecté → aperçu
  correct (organisation, rôle) → création de compte avec le paramètre
  `redirect` préservé → acceptation → arrivée sur `/dashboard` avec
  les vraies données de l'organisation rejointe (pas une nouvelle
  organisation vide) → lien « Équipe » absent du menu pour ce compte
  membre → `/equipe` renvoie un vrai 404 en accès direct (contrôle
  serveur, pas seulement un lien caché).

## 2026-08-30 — Phase 26 : journal d'activité (équipe)

Remplit la seconde moitié du module Sécurité & audit. Première
tranche volontairement limitée aux actions sur l'équipe (invitations,
rôles, retraits) — les autres modules (commandes, paiements,
produits...) ne sont pas couverts, extension prévue plus tard,
phase par phase, plutôt que tout instrumenter d'un coup.

- **`sql/phase26_journal_activite.sql`** : table `activity_logs`
  (acteur, action, cible, métadonnées). Écriture exclusivement via
  des déclencheurs (`log_invitation_activity()`,
  `log_member_activity()`, tous deux SECURITY DEFINER) posés
  directement sur `organization_invitations` et
  `organization_members` — le journal ne peut pas être oublié par un
  point d'entrée applicatif qui écrirait directement sur ces tables,
  ni falsifié depuis le client (aucune policy d'insertion directe).
  La création du premier membre (propriétaire, à la création de
  l'organisation) n'est volontairement pas journalisée.
- **`/audit`** (remplace le placeholder) : liste des 50 dernières
  actions, lisible en français (« X a invité Y », « X a changé le
  rôle de Y en Administrateur »...). Accès réservé admin/propriétaire
  comme `/equipe`, avec le même contrôle réel côté serveur — les deux
  liens de menu partagent maintenant la même condition de visibilité
  (`showAdminNav`, ex-`showTeamNav` généralisé).
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres.
- **Vérifié en direct** avec un compte de test dédié (créé pour
  l'occasion, cf. leçon retenue lors de la Phase 25) : les 5 types
  d'événements (invitation créée/acceptée/annulée, rôle changé,
  membre retiré) s'enregistrent tous correctement, dans le bon ordre,
  avec un libellé lisible et le bon rôle en clair. Accès `/audit`
  bien bloqué (404) pour un compte membre.

## 2026-08-30 — Phase 27 : fidélité (points)

Programme de points volontairement simple — pas de parrainage cette
phase (prévu plus tard, réutilisera ce même registre).

- **`sql/phase27_fidelite.sql`** : `stores.loyalty_enabled` +
  `loyalty_earn_rate` (points gagnés par unité de devise dépensée) +
  `loyalty_redeem_value` (valeur d'un point à la dépense). Table
  `loyalty_ledger` (mouvements signés, aucune policy client — ni
  lecture ni écriture directe) alimentée exclusivement par
  `checkout_cart()` étendue : gain automatique à chaque commande si
  le programme est actif, et utilisation optionnelle de points
  existants en réduction. **Sécurité de l'utilisation** : impossible
  d'utiliser des points via un panier invité — `checkout_cart()`
  exige que `auth.email()` corresponde exactement à l'email de la
  commande, sinon un visiteur aurait pu dépenser les points de
  n'importe quel email simplement en le tapant au checkout. Le nombre
  de points utilisables est systématiquement recalculé et plafonné
  côté serveur (solde réel, et jamais plus que la valeur du
  sous-total), jamais fait confiance à la valeur envoyée par le
  client. Solde consultable via `get_customer_loyalty_balance()`
  (retourne 0 pour toute personne non connectée avec cet email exact,
  sans lever d'erreur — même logique que l'éligibilité aux avis).
- **`/fidelite`** (nouvelle page marchand) : activer le programme,
  régler les deux taux.
- **Checkout boutique publique** : solde affiché si le client est
  connecté et le programme actif, champ pour utiliser tout ou partie
  de ses points (plafonné côté client par confort, revalidé côté
  serveur par sécurité).
- Confirmation de commande, détail commande client et détail
  commande marchand : réduction points affichée, points gagnés
  affichés. Compte client : badge solde de points.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres.
- **Vérifié en direct** avec un compte de test dédié : programme
  activé, produit créé, compte client inscrit → 1ère commande de
  20 € → 20 points gagnés (affiché sur la confirmation et le compte)
  → 2ème commande, 20 points utilisés → réduction de 0,20 € appliquée
  correctement, total 19,80 €, solde après coup exact (20 − 20 + 20
  gagnés sur la 2ème commande = 20). **Test de sécurité** : tentative
  d'utiliser ces mêmes points depuis un panier invité (email de la
  victime tapé manuellement, `redeemPoints` forcé dans le formulaire)
  → bloquée avec le message d'erreur attendu, aucune commande créée,
  solde du vrai client inchangé.

## 2026-08-30 — Phase 28 : parrainage

Réutilise le registre de points de la Phase 27 plutôt qu'un second
système de récompense.

- **`sql/phase28_parrainage.sql`** : `stores.referral_enabled` +
  `referral_bonus_points` (parrain) + `referral_welcome_points`
  (filleul). **Pas de colonne dédiée pour le code de parrainage** :
  dérivé de l'id client (8 caractères hex d'un md5, déterministe,
  déjà unique — aucune gestion de collision à écrire). Nouvelle
  colonne `carts.referred_by_customer_id`, posée une seule fois à la
  création du panier (jamais recalculée, jamais un champ du
  formulaire de paiement) : un visiteur qui arrive avec `?ref=CODE`
  reçoit un cookie (posé par `middleware.ts`), résolu en id client
  uniquement au moment où son panier est réellement créé
  (`ensureCart()`). `checkout_cart()` étendue une nouvelle fois :
  au premier achat réel d'un client parrainé (jamais à
  l'auto-parrainage, jamais au-delà du premier achat, jamais sans
  fidélité + parrainage tous deux activés), verse les points au
  parrain et le bonus de bienvenue au filleul.
- **`/fidelite`** : section Parrainage ajoutée (activer, régler les
  deux montants).
- **Compte client boutique** : lien de parrainage personnel affiché
  et copiable (`?ref=` + code dérivé), généré à la demande — pas
  besoin d'avoir déjà acheté pour le partager.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres.
- **Vérifié en direct** avec deux comptes de test dédiés : parrainage
  activé (50 points parrain / 30 points bienvenue) → lien copié
  depuis le compte A (parrain, solde 20) → ouvert déconnecté (cookie
  `bya_ref` confirmé posé) → inscription du compte B via ce lien →
  1ère commande de B → gagné 50 points (20 de la commande + 30 de
  bienvenue, affiché sur la confirmation) → solde de A passé de 20 à
  70 (exactement +50). **Garde-fou premier achat** : 2ème commande de
  B → seulement 20 points gagnés (aucun bonus de bienvenue répété),
  solde de A resté à 70 (aucun bonus parrain supplémentaire).

## 2026-08-30 — Phase 29 : PWA (installable)

- **Icônes** générées depuis `public/logo-mark.png` (déjà 512×512) via
  `sharp` : `public/icon-192.png`, `public/icon-512.png`.
- **`app/manifest.ts`** : manifeste racine « BYA Flow » (espace
  marchand installable, `start_url: /dashboard`).
- **Manifeste par boutique**, avec le nom/logo/couleur du marchand
  (chaque boutique s'installe indépendamment, avec sa propre
  identité) : `app/store/[slug]/manifest.webmanifest/route.ts`,
  référencé depuis `generateMetadata()` dans
  `app/store/[slug]/layout.tsx`. **Bug trouvé en cours de route** : le
  fichier spécial `manifest.ts` de Next.js n'est reconnu qu'à la
  racine de l'app, jamais par segment de route dynamique — confirmé
  par le build qui ne générait aucune route pour un premier essai en
  `app/store/[slug]/manifest.ts` (contrairement à `icon.tsx` ou
  `opengraph-image.tsx`, qui eux supportent l'imbrication). Remplacé
  par un Route Handler classique (`route.ts`), qui fonctionne
  normalement sous un segment dynamique.
- **`public/sw.js`** : service worker minimal (réseau d'abord, cache
  de secours hors-ligne pour les pages déjà visitées), uniquement sur
  les requêtes GET du même site — jamais les server actions (POST) ni
  les appels Supabase, pour ne jamais servir une réponse périmée à la
  place d'une écriture ou d'une vérification de session. Enregistré
  via `components/RegisterServiceWorker.tsx` dans `app/layout.tsx`.
- **Bug trouvé en vérifiant le middleware** (même catégorie que le
  bug `/robots.txt` de la Phase 24) : `/manifest.webmanifest` et
  `/sw.js` n'étaient pas dans `PUBLIC_PATHS`, donc auraient été
  redirigés vers `/login` pour un visiteur non connecté sur une page
  hors `/store/*`. Corrigé avant même la vérification en direct.
- Vérifié : `next build` (confirmé `/manifest.webmanifest` et
  `/store/[slug]/manifest.webmanifest` bien générés en tant que
  routes distinctes), `next lint`, `npm test` (14/14) tous propres.
- **Vérifié en direct** : `/manifest.webmanifest` (racine) et
  `/store/[slug]/manifest.webmanifest` répondent 200 avec le bon
  contenu (nom, couleur, icônes propres à chaque boutique) ;
  `/sw.js` servi avec le bon `Content-Type` ; `<link rel="manifest">`
  correctement injecté — celui de la boutique sur les pages
  boutique, celui de BYA Flow sur l'espace marchand ; service worker
  effectivement enregistré et actif dans le navigateur.

## 2026-08-30 — Phase 30 : robustesse des connexions

Demande utilisateur : tous les moyens de connexion (mot de passe
oublié, changer de mot de passe, changer d'email, confirmation à
l'inscription, œil pour afficher le mot de passe), plus un signalement
« la connexion bloque toujours ».

- **Diagnostic du blocage** : reproduction en direct impossible avec
  deux comptes de test (connexion marchand et boutique instantanées,
  clics réels). L'utilisateur a précisé : les deux connexions, et
  « rien ne se passe du tout ». Cause la plus probable trouvée en
  lisant le code : **aucun bouton de l'app n'avait d'état de
  chargement** — sur un aller-retour lent (cold start Vercel/Supabase),
  le bouton reste identique pendant 1 à 3 s, donnant exactement
  l'impression que rien ne s'est passé.
- **`components/ui/SubmitButton.tsx`** (`useFormStatus`) : affiche un
  texte de chargement et se désactive pendant l'envoi. Appliqué à
  tous les formulaires d'authentification, marchand et boutique.
- **`components/ui/PasswordInput.tsx`** : champ mot de passe avec
  bouton œil (afficher/masquer), appliqué partout où un mot de passe
  est saisi.
- **Parcours manquant côté boutique, ajouté** : mot de passe oublié
  (`/store/[slug]/compte/mot-de-passe-oublie` +
  `requestCustomerPasswordReset()`) et sa page de réinitialisation
  (`/store/[slug]/compte/reinitialiser-mot-de-passe`) — le compte
  client n'avait que connexion/inscription, aucun moyen de récupérer
  un mot de passe oublié.
- **Changer le mot de passe une fois connecté** : `updatePassword()`
  (déjà utilisée par le lien de récupération) généralisée avec deux
  champs cachés `redirect`/`errorRedirect`, réutilisée telle quelle
  sur `/parametres` (marchand) et `/store/[slug]/compte` (client) —
  pas de logique dupliquée.
- **Changer d'email** : nouvelle action `updateEmail()`
  (`supabase.auth.updateUser({ email })`), même principe de
  réutilisation entre `/parametres` et le compte client. Supabase
  envoie la confirmation à la nouvelle adresse (et à l'ancienne selon
  le réglage "Secure email change" du projet) avant que le
  changement ne prenne effet — géré automatiquement par
  `/auth/callback`, déjà générique.
- **Fiabilité des emails (Resend)** : pas un changement de code —
  configuration à faire par l'utilisateur dans le tableau de bord
  Supabase (Authentication → Emails → SMTP Settings), avec les
  identifiants SMTP de son compte Resend existant. Nécessaire pour
  que confirmation d'inscription / réinitialisation / changement
  d'email arrivent réellement (le SMTP intégré de Supabase avait déjà
  échoué une fois cette session sur un domaine factice).
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres.
- **Vérifié en direct** : œil du mot de passe change bien le `type`
  du champ ; bouton « Connexion... » désactivé et visible pendant
  l'envoi (confirmé à l'instant T, avant redirection) ; changer de
  mot de passe sur `/parametres` → ancien mot de passe rejeté à la
  reconnexion, nouveau accepté ; changer d'email → message de
  confirmation affiché, email affiché resté inchangé tant que le lien
  envoyé à la nouvelle adresse n'est pas cliqué (comportement Supabase
  attendu) ; mot de passe oublié côté boutique (parcours qui
  n'existait pas) → lien visible sur la page de connexion, formulaire
  fonctionnel, message générique renvoyé.

## 2026-08-31 — Phase 31 : API & webhooks (v1)

Première tranche volontairement limitée : API en lecture seule
(produits, commandes), un seul événement de webhook (order.created).
Pas d'écriture via API, pas de file de relance en cas d'échec de
livraison d'un webhook — prévu plus tard si le besoin se confirme.

- **Aucune clé service_role introduite** : ce projet ne l'a jamais
  utilisée nulle part (retirée de `.env.example` en Phase 13, RLS
  seule frontière de sécurité — cf. plus haut dans ce fichier).
  L'authentification par clé API et l'accès aux données passent donc
  par des fonctions SECURITY DEFINER (`api_authenticate()`,
  `api_list_products()`, `api_get_product()`, `api_list_orders()`,
  `api_get_order()`, `api_get_order_items()`,
  `get_active_order_webhooks()`), même principe que partout ailleurs
  dans ce projet — jamais un rôle qui contournerait globalement la
  RLS.
- **`sql/phase31_api_webhooks.sql`** : tables `api_keys` (hash
  SHA-256 calculé côté Node, jamais la clé en clair stockée ni
  transmise à Postgres) et `webhook_endpoints` (secret HMAC en clair
  cette fois — nécessaire, on doit le réutiliser à chaque envoi pour
  signer, contrairement à une clé API qui est un jeton présenté par
  autrui).
- **`app/api/v1/{products,orders}[/[id]]`** : Route Handlers,
  authentification par `Authorization: Bearer <clé>`, scopes
  `products:read` / `orders:read`. `middleware.ts` étendu pour
  laisser `/api/*` totalement en dehors des vérifications de session
  marchand (un appelant externe n'a aucun cookie).
- **`/developpeurs`** (nouvelle page, réservée admin/propriétaire
  comme `/equipe` et `/audit`) : création/révocation de clés API
  (la clé en clair n'est affichée qu'une seule fois, à la création —
  jamais via un paramètre d'URL, `useFormState` pour la retourner
  directement en mémoire ; toute clé ne stocke que son hash ensuite),
  gestion des webhooks (créer/activer/désactiver/supprimer, secret de
  signature affiché pour vérification côté récepteur).
- **Déclenchement webhook** : `submitCheckout()` appelle
  `dispatchOrderCreatedWebhooks()` juste après la création réussie
  d'une commande — attendu (avec un délai plafonné à 5 s par appel),
  pas un vrai "fire and forget", car rien ne garantit qu'une requête
  non attendue survive à la fin de l'invocation serverless après le
  `redirect()`.
- Vérifié : `next build` (bug de build trouvé et corrigé avant tout
  autre test : une constante exportée depuis un fichier `"use server"`
  fait échouer le build Next — déplacée dans un fichier séparé),
  `next lint`, `npm test` (14/14) tous propres.
- **Vérifié en direct**, de bout en bout : clé créée (affichée une
  seule fois) → `GET /api/v1/products` avec la clé → 200 ; sans clé →
  401 ; clé invalide → 401 ; clé révoquée → 401 immédiatement après
  révocation ; clé limitée à `products:read` → 403 sur `/orders`, 200
  sur `/products` (scope bien vérifié) ; `GET /api/v1/orders/[id]`
  retourne bien les articles de la commande. Webhook créé avec une
  URL de test (webhook.site) → commande réelle passée → requête
  effectivement reçue avec le bon payload JSON et la bonne signature
  (recalculée localement en Node avec le secret affiché, identique
  au header `X-BYA-Signature` reçu — signature vérifiable confirmée).
  Webhook désactivé → commande suivante → aucune requête reçue.
  Éléments de test nettoyés après vérification (clé révoquée, webhook
  supprimé).

## 2026-09-03 — Phase 32 : multi-boutiques

Demandé avec POS et domaine personnalisé « à la fois » ; traité en
premier et seul, les deux autres restant à faire ensuite — même
discipline phase par phase que tout ce projet depuis le début.

- **Audit avant tout code** (agent dédié) : la quasi-totalité de
  l'app (51 fichiers) résout déjà « la boutique courante » via
  `getCurrentStore()`, une seule fonction centrale — bien plus
  centralisé que redouté. Un seul contournement trouvé :
  `app/(app)/dashboard/page.tsx` dupliquait la même requête
  « première boutique de l'organisation » en inline. Aucun verrou
  SQL n'empêche une deuxième boutique par organisation (RLS
  `stores_insert_member` l'autorise déjà à tout membre, le trigger
  de slug gère déjà les collisions) — **aucune migration nécessaire
  pour cette phase**. La boutique publique (`/store/[slug]`) n'a
  jamais eu ce problème : elle est déjà scopée par slug à chaque
  requête, par construction.
- **`getCurrentStore()`** (`lib/data/store.ts`) : respecte désormais
  un cookie `bya_current_store` (boutique sélectionnée), toujours
  re-vérifié contre l'organisation du membre connecté avant d'être
  utilisé — un cookie forgé vers la boutique d'une autre organisation
  ne peut rien renvoyer d'autre que le repli normal (première
  boutique créée), même comportement qu'avant pour toute organisation
  qui n'a encore qu'une seule boutique. `getOrgStores()` ajoutée pour
  lister toutes les boutiques d'une organisation.
- **`switchStore()` / `createStore()`** (`lib/actions/store.ts`) :
  bascule (pose le cookie) et création d'une nouvelle boutique
  (réutilise directement la policy RLS et le trigger de slug déjà en
  place, aucune fonction SECURITY DEFINER nécessaire) — bascule
  automatiquement dessus après création.
- **`app/(app)/dashboard/page.tsx`** : contournement corrigé,
  utilise maintenant `getCurrentStore()` comme tout le reste de
  l'app.
- **Sélecteur de boutique** (`components/layout/StoreSwitcher.tsx`) :
  affiché dans la Topbar uniquement si l'organisation a plus d'une
  boutique (rien ne change visuellement pour l'immense majorité des
  organisations mono-boutique) ; redirige vers la page courante après
  bascule, pas systématiquement vers le tableau de bord.
- **`/boutique`** : section « Vos boutiques » (bascule) et « Ajouter
  une boutique » (nom + devise) ajoutées.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres.
- **Vérifié en direct** : compte mono-boutique existant → aucun
  changement visuel, sélecteur absent, données du tableau de bord
  identiques à avant la phase. Création d'une deuxième boutique
  (devise XOF) → bascule automatique dessus, tableau de bord
  correctement vide (0 F CFA, aucune vente), « Nouveaux clients »
  resté à 4 (CRM bien partagé au niveau organisation, comme prévu).
  Bascule vers la première boutique → données exactes retrouvées
  (120 €, 6 commandes). Bascule testée aussi depuis `/produits` :
  reste bien sur `/produits` après bascule (pas de redirection forcée
  vers le tableau de bord) ; catalogue de la boutique 1 affiche son
  produit, catalogue de la boutique 2 vide — isolation confirmée.

## 2026-09-03 — Phase 33 : point de vente (caisse)

Deuxième des trois chantiers demandés ensemble (multi-boutiques, POS,
domaine personnalisé), traités un par un comme convenu.

- **Aucune simulation de paiement** : contrairement au checkout en
  ligne (`payment_status` reste `pending` faute de vrai prestataire),
  une vente en caisse est marquée `paid` directement — ce n'est pas
  l'app qui invente un résultat, c'est le vendeur qui constate
  lui-même avoir reçu le paiement en personne (espèces ou carte via
  son propre terminal), exactement comme une caisse enregistreuse
  classique. Statut de commande `delivered` d'emblée (le client
  repart avec l'article immédiatement).
- **`sql/phase33_pos.sql`** : `orders.channel` (`online`/`pos`) et
  `orders.payment_method` (`cash`/`card`/`other`) ; fonction
  `create_pos_order()` (SECURITY DEFINER, même principe que
  `checkout_cart()`) — revalide systématiquement stock et prix
  courant des produits, jamais un montant envoyé par le client ;
  client optionnel (retrouvé/créé par email, même logique que
  `checkout_cart()`, sinon vente anonyme comme un vrai commerce de
  détail).
- **`/caisse`** : recherche produit, panier en cours (React côté
  client, quantités ajustées en direct dans la limite du stock
  affiché — revalidé de toute façon côté serveur à l'encaissement),
  client optionnel, choix du mode de paiement. **`/caisse/[id]`** :
  ticket récapitulatif, imprimable (`window.print()`, mise en page
  masquée via les classes `print:hidden` de Tailwind).
- **`/commandes`** (liste et détail) : badge Canal (Boutique en
  ligne / Caisse) et mode de paiement affichés, pour qu'un marchand
  qui vend sur les deux canaux distingue facilement.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres.
- **Vérifié en direct** : vente de 2 × Produit Fidelite Test (94 en
  stock) en espèces → ticket #15 correct (produit, quantité, total,
  mode de paiement) → stock passé à 92 (exactement -2) → commande
  #15 apparaît dans `/commandes` avec le badge Caisse, statut Livrée,
  paiement Payé, pendant que les commandes en ligne restent
  distinctes (En ligne / En attente) → tableau de bord mis à jour
  correctement (chiffre d'affaires 120 € → 160 €, 6 → 7 commandes,
  6 → 8 unités vendues) : la vente en caisse s'intègre exactement
  comme une vente en ligne dans les statistiques.

## 2026-09-03 — Phase 34 : domaine personnalisé (v1)

Troisième et dernier des trois chantiers demandés ensemble. Modèle
retenu : **domaine propre du marchand**, pas de sous-domaine
`xxx.bya-flow.com` (aucun domaine racine BYA Digital disponible pour
l'instant, et ça demanderait de toute façon le plan Vercel Pro pour
les domaines wildcard).

- **Pas d'appel à l'API Domaines de Vercel dans cette première
  tranche** — nécessiterait un jeton Vercel non encore fourni. À la
  place : le marchand soumet son domaine dans l'app
  (`/boutique/domaine`), BYA Digital l'ajoute manuellement au projet
  Vercel (Settings → Domains) puis le marque vérifié depuis
  `/admin-plateforme` (nouveau panneau « Domaines personnalisés en
  attente »). L'app fait déjà tout le travail de routage ; seul le
  rattachement Vercel reste un geste manuel.
- **`sql/phase34_domaine_personnalise.sql`** : `stores.custom_domain`
  (unique) + `custom_domain_verified_at`. Nouvelle policy
  `stores_update_platform_admin` (même principe que
  `subscriptions_update_platform_admin`, Phase 15) pour que BYA
  Digital puisse marquer un domaine vérifié — aucune policy de
  lecture supplémentaire nécessaire, `stores_select_public` (Phase 16)
  couvre déjà la lecture par nom d'hôte dont le middleware a besoin.
- **`middleware.ts`** : toute requête dont l'en-tête `Host` ne
  correspond ni au domaine du site ni à un `*.vercel.app` est résolue
  contre `stores.custom_domain` (lecture publique, sans session) ; si
  trouvée et vérifiée, réécrite vers `/store/[slug]/...` avant même la
  logique d'authentification marchand — un domaine personnalisé sert
  toujours la boutique publique, jamais l'espace de gestion. Le reste
  du middleware raisonne ensuite sur le chemin réécrit, pas l'original.
- **`/boutique/domaine`** : soumission du domaine (normalisation —
  accepte une URL collée par erreur, n'en garde que le nom d'hôte),
  instructions DNS (CNAME vers `cname.vercel-dns.com`), statut en
  attente/actif.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres.
- **Vérifié en direct, dans la limite du possible sans domaine réel** :
  soumission d'un domaine de test → statut « En attente de
  rattachement » et instructions DNS affichées correctement →
  vérification manuelle (SQL, faute d'accès admin plateforme sur le
  compte de test) → statut « Actif », instructions masquées comme
  prévu → retrait → retour propre au formulaire de soumission.
  **Le routage lui-même (le cœur technique de cette phase) n'a pas pu
  être vérifié de bout en bout** : une requête avec un en-tête `Host`
  forgé vers un domaine non enregistré est rejetée par Vercel avant
  même d'atteindre le code de l'app (« DEPLOYMENT_NOT_FOUND ») —
  Vercel valide lui-même le nom d'hôte au niveau de son edge, donc
  aucun moyen de simuler ça sans un vrai domaine réellement ajouté au
  projet Vercel. Attendu et déjà annoncé à l'utilisateur avant de
  commencer cette phase. Aucune régression détectée par ailleurs :
  toute la session a continué à naviguer normalement sur
  bya-flow.vercel.app via ce même middleware modifié.

## 2026-09-08 — Phase 35 : premier vrai paiement (Kkiapay)

Audit technique complet redemandé après plusieurs jours d'absence
(rapport donné, rien de cassé, dépôt synchronisé) — puis premier
fournisseur de paiement réellement connecté, à la demande explicite de
l'utilisateur (« Maketou et Kkiapay », traités un à la fois : Kkiapay
d'abord).

- **Détails d'API vérifiés avant tout code** (jamais inventés, cf.
  règle « ne pas inventer ») : documentation officielle Kkiapay +
  lecture directe du SDK PHP officiel
  (github.com/kkiapay/php-sdk/src/Kkiapay.php) pour confirmer l'URL de
  base réelle (`api.kkiapay.me` / `api-sandbox.kkiapay.me`),
  l'endpoint de vérification (`POST /api/v1/transactions/status`), les
  en-têtes exacts (`X-API-KEY`, `X-PRIVATE-KEY`, `X-SECRET-KEY`), et le
  widget JS (`cdn.kkiapay.me/k.js`, `openKkiapayWidget()`,
  `addSuccessListener()`).
- **`lib/payments/providers/kkiapayProvider.ts`** remplace le stub :
  `checkStatus()` appelle réellement l'API Kkiapay et ne fait jamais
  confiance à un montant/statut fourni par le client — c'est la seule
  source de vérité pour marquer une commande payée, utilisée à la fois
  par la confirmation côté client et par le webhook entrant.
- **`sql/phase35_paiement_kkiapay.sql`** : `get_payment_provider_config()`
  (lecture ciblée, sans session — le secret ne sert qu'à l'appel
  serveur→Kkiapay, jamais renvoyé au navigateur) et
  `confirm_order_payment()` (idempotente : webhook + confirmation
  client peuvent arriver deux fois sans double effet ; refuse tout
  montant vérifié inférieur au total de la commande). Toujours aucune
  clé `service_role` — même principe SECURITY DEFINER ciblé que
  partout ailleurs dans ce projet.
- **Parcours client** : après une commande, si Kkiapay est actif pour
  la boutique, redirection vers `/store/[slug]/commande/[id]/payer`
  (nouveau) qui ouvre le widget Kkiapay ; sinon comportement inchangé
  (commande en attente, comme avant). Widget → succès → confirmation
  serveur → `payment_status = paid`, `status` passe de `pending` à
  `confirmed`.
- **`app/api/webhooks/kkiapay/route.ts`** (webhook entrant, à ne pas
  confondre avec les webhooks marchands sortants de la Phase 31) :
  chemin de confirmation de secours si le navigateur se ferme avant le
  retour du widget. En-tête `x-kkiapay-secret` vérifié en filtre
  souple (l'algorithme exact n'est pas documenté précisément par
  Kkiapay) — jamais bloquant en cas de doute, la confirmation réelle
  vient toujours de `checkStatus()`.
- **`/paiements`** : case à cocher « Mode test (sandbox) » ajoutée aux
  réglages Kkiapay (nouveau type de champ non sensible dans
  `PaymentProviderField`, jamais envoyé au navigateur pour les vrais
  secrets).
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres. Vérification en conditions réelles à faire avec le compte
  sandbox Kkiapay de l'utilisateur — mise en pause à sa demande
  (configuré sur un compte auquel je n'ai pas accès), reprise dès
  qu'il est prêt.

## 2026-09-10 — Phase 36 : supprimer une boutique

- **Aucune policy de suppression n'existait sur `stores`** (Phase 2 :
  seulement select/insert/update pour les membres) — ajoutée,
  réservée admin/propriétaire (`sql/phase36_supprimer_boutique.sql`),
  contrairement à la création qui reste ouverte à tout membre.
- **`deleteStore()`** (`lib/actions/store.ts`) : les vrais garde-fous
  sont côté application, pas seulement RLS — jamais la dernière
  boutique de l'organisation (sinon plus aucune boutique courante
  nulle part dans l'app), et jamais une boutique qui a déjà des
  commandes (la suppression cascade sur produits/livraison/paiements/
  commandes — on ne perd jamais un historique financier réel pour un
  simple clic ; message clair invitant à désactiver plutôt que
  supprimer dans ce cas). Efface le cookie de boutique sélectionnée
  si c'est elle qui vient d'être supprimée.
- **`/boutique`** : bouton supprimer (avec confirmation) à côté de
  chaque boutique dans la liste, visible uniquement pour un
  admin/propriétaire.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres. Vérification en conditions réelles à faire.

## 2026-09-10 — Correctif performance boutique (lenteur au clic)

- **Symptôme signalé** : la boutique publique réagit tardivement à un
  clic (jusqu'à 5 secondes), malgré une connexion internet correcte
  côté utilisateur.
- **Diagnostic mesuré** (`curl -w` sur la prod, pas une supposition) :
  TTFB réel de 1.3 à 3.7s en base, un pic isolé à 18.7s — confirmé
  côté serveur, pas côté réseau client. En-tête `X-Vercel-Id` : région
  Vercel `iad1` (US East) — mésalignement possible avec la région
  Supabase (non vérifiable sans accès au dashboard Supabase de
  l'utilisateur, à surveiller).
- **Cause principale trouvée dans le code** : appels Supabase
  redondants et séquentiels sur une même requête —
  `getPublicStoreBySlug()` relu indépendamment par `layout.tsx` ET
  chaque `page.tsx` sous `/store/[slug]/**` ; `supabase.auth.getUser()`
  appelé séparément par `getCustomerSession()`, `getPublicCart()`,
  `getWishlistProductIds()`/`getWishlistProducts()` au lieu d'être
  partagé.
- **`lib/supabase/server.ts`** : nouveau `getCurrentUser()`
  (`cache()` de React) — dé-duplique `auth.getUser()` sur toute une
  passe de rendu serveur (layout + page + composants), sans rien
  changer à l'architecture.
- **`getPublicStoreBySlug`** (`lib/data/publicStore.ts`),
  **`getCustomerSession`** (`lib/data/customerAccount.ts`) : passés en
  `cache()`. **`getPublicCart`** (`lib/data/publicCart.ts`),
  **`getWishlistProductIds`/`getWishlistProducts`**
  (`lib/data/wishlist.ts`) : utilisent désormais le `getCurrentUser()`
  partagé au lieu de leur propre appel.
- **`app/store/[slug]/layout.tsx`** : `getPublicStoreBySlug()` et
  `getCustomerSession()` (indépendants l'un de l'autre) lancés en
  parallèle via `Promise.all` au lieu d'attendre l'un puis l'autre.
- **Retour visuel de chargement** (composant `SubmitButton` de la
  Phase 30, jusqu'ici réservé aux formulaires d'auth) ajouté sur les
  boutons de la boutique publique qui n'avaient aucun feedback : «
  Ajouter au panier » et « Publier mon avis »
  (`produits/[productSlug]/page.tsx`), « Modifier » (quantité) et le
  bouton retirer du panier (`panier/page.tsx`) — le clic ne semble
  plus « mort » pendant la latence serveur, même quand celle-ci
  n'est pas totalement éliminée.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres. Comparaison de latence avant/après et vérification
  fonctionnelle du panier/checkout à faire en conditions réelles.

## 2026-09-10 — Correctif critique : confirmation email / mot de passe oublié cassés

- **Signalé** : après une inscription, impossible de se reconnecter
  avec les mêmes identifiants ; « mot de passe oublié » ne fonctionne
  pas non plus. Deux bugs réels trouvés en lisant le code, aucun des
  deux lié à l'envoi d'email lui-même.
- **Bug 1 (inscription marchand, `signUp()` dans `lib/actions/auth.ts`)** :
  l'appel `supabase.auth.signUp()` ne passait aucun `emailRedirectTo`.
  Sans lui, Supabase renvoie le lien de confirmation vers la Site URL
  brute du projet, qui ne sait échanger aucun lien — le compte reste
  non confirmé pour toujours et `signInWithPassword()` échoue
  indéfiniment ensuite avec « Email not confirmed ». L'inscription
  boutique cliente (`signupCustomer`) n'avait pas ce bug précis (elle
  passait déjà un `emailRedirectTo`).
- **Bug 2 (tous les flux par email, marchand ET boutique)** : le flux
  PKCE (`/auth/callback` + `exchangeCodeForSession(code)`) exige que le
  lien reçu par email soit ouvert dans le **même navigateur** que celui
  qui a fait la demande, à cause d'un cookie `code_verifier` propre à
  ce navigateur — ce qui échoue quasi systématiquement dès que
  l'utilisateur ouvre son email depuis son téléphone ou une autre
  application (le cas le plus courant, de loin). C'est la cause réelle
  de « mot de passe oublié ne marche pas ».
- **Correctif** : remplacement du flux PKCE par le flux `token_hash` +
  `verifyOtp()`, recommandé par Supabase précisément pour ce problème
  — aucun cookie requis, fonctionne sur n'importe quel appareil.
  Nouvelle route `app/auth/confirm/route.ts` (remplace
  `app/auth/callback/route.ts`, supprimée) ; les 4 points d'entrée
  (`signUp`, `requestPasswordReset` dans `lib/actions/auth.ts`,
  `signupCustomer`, `requestCustomerPasswordReset` dans
  `lib/actions/customerAuth.ts`) passent maintenant `emailRedirectTo`/
  `redirectTo` comme la destination finale directement (le HTML de
  l'email construit lui-même l'URL `/auth/confirm?token_hash=...&type=...`
  via `{{ .RedirectTo }}`) ; `updateEmail()` migré de la même façon par
  cohérence. `middleware.ts` : `/auth/confirm` remplace `/auth/callback`
  dans les chemins publics.
- **⚠️ Action manuelle requise côté utilisateur (Supabase Dashboard →
  Authentication → Email Templates)** — le code seul ne suffit pas,
  les 3 templates concernés doivent pointer vers `/auth/confirm` :
  - **Confirm signup** : `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}`
  - **Reset Password** : `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}`
  - **Change Email Address** : `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next={{ .RedirectTo }}`
  Sans ça les liens envoyés continueront de pointer vers l'ancien
  format et échoueront. Rappel toujours valable par ailleurs : la
  délivrabilité réelle des emails dépend d'un SMTP personnalisé
  (Resend) configuré dans Supabase — le service email intégré par
  défaut est très limité en volume.
- Vérifié : `next build`, `next lint`, `npm test` (14/14) tous
  propres. Vérification en conditions réelles bloquée tant que les
  3 templates ci-dessus n'ont pas été mis à jour côté utilisateur.

## 2026-09-10 — Phase 35A + 35B : audit et durcissement du Payment Engine

Suite à la directive de continuation post-audit (2026-09-10) : BYA Flow
ne doit jamais encaisser ni redistribuer l'argent des marchands (chaque
marchand utilise son propre compte PSP, déjà le cas avec Kkiapay), et
aucun nouveau PSP réel ne doit être choisi/codé avant que l'architecture
Payment Engine elle-même soit auditée et solidifiée.

**Phase 35A (audit, livré en conversation)** : architecture déjà saine
dans ses grandes lignes (interface `PaymentProvider` jamais contournée,
`payment_status` jamais décidé côté client, idempotence réelle via
contrainte SQL unique, zéro `service_role`) mais 6 points concrets à
corriger — détaillés ci-dessous.

**Phase 35B (correctifs)** :
- **`lib/payments/types.ts`** : `PaymentProviderId` étendu avec
  `flutterwave`, `cinetpay`, `paystack` (terrain préparé uniquement,
  comme les 8 fournisseurs existants — directive Section 4 : ne pas
  encore choisir/coder d'intégration production pour eux). Nouveau
  champ `checkoutMode: "widget" | "redirect"` sur `PaymentProvider`
  pour que le checkout n'ait plus besoin de connaître chaque
  fournisseur individuellement. Nouvelle méthode optionnelle
  `refund()` (absente tant qu'aucun fournisseur ne l'implémente
  réellement — jamais une fausse méthode).
- **`lib/actions/checkout.ts`** et **`.../payer/page.tsx`** :
  ne vérifient plus `.eq("provider", "kkiapay")` en dur — n'importe
  quel fournisseur actif redirige vers `/payer`, qui choisit
  l'affichage selon `checkoutMode` (widget Kkiapay si actif ; sinon
  message transparent "pas encore réellement connecté", jamais un
  faux parcours de paiement).
- **`sql/phase35b_payment_engine_hardening.sql`** :
  - `orders.payment_status` élargi (`pending/processing/paid/failed/
    cancelled/refunded/partially_refunded` — était limité à
    `pending/paid/refunded` depuis la Phase 5) ; `payment_transactions.
    status` gagne `partially_refunded` pour rester cohérent.
  - **Secrets de paiement restreints aux admin/propriétaire** : la RLS
    de `payment_providers` (Phase 21) laissait n'importe quel membre
    d'équipe lire/écrire les clés API du compte PSP du marchand —
    corrigé (`is_store_admin()`, même principe que `deleteStore()` en
    Phase 36), doublé côté action (`savePaymentProvider`) et côté UI
    (`PaymentProviderCard` désactivé pour un simple membre, nouvelle
    fonction `get_store_active_payment_providers()` pour qu'il
    continue de voir actif/inactif sans jamais voir la config).
  - **Journalisation anti-rejeu des webhooks** : nouvelle table
    `payment_webhook_events` + `record_payment_webhook_event()` —
    un webhook Kkiapay déjà reçu (retry réseau, livraison en double)
    est désormais détecté avant même de rappeler `checkStatus()`,
    plutôt que de simplement compter sur l'idempotence de
    `confirm_order_payment()` en aval.
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (14/14) tous propres. Vérification en conditions réelles à faire
  une fois le SQL collé (Kkiapay doit continuer à fonctionner
  exactement comme avant).

## 2026-09-10 — Phase 37 : produits numériques (téléchargement sécurisé)

Suite à la directive de continuation (Section 11) : premier vrai
chantier après le durcissement du Payment Engine.

- **`products.product_type`** (`physical`/`digital`, défaut `physical` —
  zéro impact sur les produits existants) + `digital_file_path`/
  `digital_file_name`/`digital_file_size`. Un seul fichier par produit
  numérique (upload = remplace toujours l'éventuel fichier précédent,
  y compris en storage — jamais de fichier orphelin).
- **Bucket Storage `digital-products` : PRIVÉ** (contrairement à
  `product-images`/`store-assets`, publics) — jamais d'URL publique.
  La lecture passe uniquement par une URL signée à durée de vie courte
  (5 min), générée à la demande côté serveur après vérification que
  l'acheteur a réellement payé cette ligne de commande précise
  (`get_digital_file_for_download()` + policy RLS
  `customer_has_paid_digital_access()` — double barrière : même un
  bug dans la première laisserait la seconde bloquer `createSignedUrl()`).
  Comportement vérifié auprès de la documentation Supabase avant
  d'écrire le code (createSignedUrl() applique bien RLS, jamais un
  bypass — jamais inventé).
- **Propriété de commande unifiée** : nouvelle `is_order_owner()`
  combine les deux chemins déjà existants séparément
  (`is_order_owner_anon` pour un panier invité, `is_order_owner_account`
  pour un compte client) — réutilisée pour l'accès au fichier ET pour
  `get_order_item_product_types()` (permet d'afficher le bouton
  télécharger même si le marchand a dépublié le produit depuis l'achat,
  sans dépendre de `products_select_public` qui l'aurait empêché).
- **Stock jamais pertinent pour un produit numérique** :
  `checkout_cart()` et `create_pos_order()` (re-créées, seule
  différence avec Phase 28/33 : le contrôle/décrément de stock
  n'agit plus que sur `product_type = 'physical'`). Côté storefront
  (7+ endroits lisent `stock` comme un inventaire réel : badge
  "rupture", quantité max...), plutôt que retoucher chaque page,
  un produit numérique s'écrit avec un stock volontairement très
  élevé (jamais réellement décrémenté ni vérifié côté serveur) — un
  seul point de correction côté écriture au lieu de sept côté lecture.
- **`/produits/[id]`** : nouvelle carte "Fichier numérique" (upload/
  remplacement/suppression, jamais accessible publiquement) +
  compteur de téléchargements (`product_downloads`, journal alimenté
  uniquement par `record_product_download()`, jamais une écriture
  directe). Impossible d'activer un produit numérique sans fichier
  déjà présent (à la création, forcé en brouillon avec message
  explicatif — le fichier ne peut être ajouté qu'après coup).
- **Confirmation de commande + compte client** : bouton télécharger
  par ligne numérique payée, ou message "disponible après paiement"
  sinon — jamais un lien exploitable avant paiement réellement vérifié.
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (14/14) tous propres. Vérification en conditions réelles bloquée
  tant que le SQL n'a pas été collé (colonnes/tables/bucket
  inexistants avant ça).

## 2026-09-10 — Phase 37 (suite) : repasser en brouillon si le fichier numérique est supprimé

Un produit numérique actif dont on supprime le fichier restait
"Actif" sans plus rien à livrer — repasse maintenant automatiquement
en brouillon (même principe que la garde à l'activation), avec un
message explicatif. Vérifié en conditions réelles sur le site live
après ce correctif : création d'un produit numérique, upload,
activation, suppression du fichier → repasse bien en brouillon.

## 2026-09-10 — Phase 38 : formations (modules, leçons, progression)

Troisième type de produit après physique/numérique (directive
Section 12). Aucune vidéo hébergée par BYA Flow — `video_url` pointe
vers une vidéo hébergée ailleurs par le marchand (YouTube/Vimeo
reconnus et embarqués automatiquement, tout autre lien reste un
simple lien externe plutôt qu'une iframe risquée sur un domaine
arbitraire).

- **`products.product_type`** gagne `'course'`. **`course_modules`**
  (product_id, title, position) → **`course_lessons`** (module_id,
  title, position, video_url, content, file_path, file_name). Le
  fichier de leçon (support de cours, PDF...) réutilise **le même
  bucket privé `digital-products` de la Phase 37**, même convention
  de chemin (`${storeId}/${productId}/...`) — les policies RLS déjà
  en place couvrent donc aussi les fichiers de leçon sans rien
  ajouter côté storage.
- **Accès réservé aux comptes clients connectés**, jamais un panier
  invité anonyme : la progression n'aurait aucun sens si l'identité
  ne survit pas à la fermeture du navigateur. `customer_has_paid_
  digital_access()` (Phase 37, déjà générique malgré son nom) réutilisée
  telle quelle pour l'accès aux modules/leçons — pas de nouvelle
  fonction d'ownership dupliquée.
- **`mark_lesson_complete()`** (SECURITY DEFINER) revérifie elle-même
  le paiement avant d'écrire — jamais un lessonId de confiance seul
  ni un customer_id fourni par le client.
- **`/produits/[id]`** : nouvelle carte "Modules et leçons"
  (`CourseBuilder`) à la place de Variantes pour ce type de produit.
  Impossible d'activer une formation sans au moins une leçon (même
  garde que le fichier numérique en Phase 37, y compris à la création
  où c'est structurellement impossible d'avoir déjà du contenu — forcé
  en brouillon avec message explicatif).
- **`/store/[slug]/compte/formations/[productId]`** : espace
  formation du client — vérifie lui-même l'achat payé (indépendamment
  de la RLS sur course_modules, double vérification), barre de
  progression, une leçon = vidéo embarquée et/ou texte et/ou fichier
  à télécharger (URL signée courte, même discipline que Phase 37) +
  case à cocher "Terminé" persistée.
- Lien vers l'espace formation ajouté sur la confirmation de commande
  (invite à se connecter, jamais un accès direct pour un panier
  invité) et sur le détail de commande du compte client (lien direct,
  toujours connecté à cet endroit).
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (14/14) tous propres. Vérification en conditions réelles bloquée
  tant que le SQL n'a pas été collé.

## 2026-09-10 — Phase 39 : Page Builder

Pages de vente sans code (directive Section 13). Une page = un titre/
slug + un tableau ordonné de blocs (`blocks jsonb`), pas une table par
type de bloc — un nouveau type de bloc s'ajoutera plus tard sans
migration (juste une entrée dans `lib/pageBuilder/types.ts` et un cas
dans `BlockRenderer`).

- **15 types de blocs** (Hero, Titre, Texte, Image, Vidéo, Bouton,
  Formulaire, Produit, Prix, Témoignage, FAQ, Avantages, Compte à
  rebours, CTA, Pied de page) — la vidéo n'est jamais hébergée par BYA
  Flow (lien externe embarqué si YouTube/Vimeo reconnu, sinon simple
  lien, même principe que la Phase 38 pour les leçons).
- **`/pages-de-vente`** (nouvelle entrée de menu "Commerce") :
  liste, création, éditeur par blocs (`PageEditor` — ajout/suppression/
  duplication/réorganisation haut-bas, tout en mémoire côté client puis
  un seul `UPDATE` du tableau `blocks` à l'enregistrement), aperçu
  ("Voir la page" fonctionne même en brouillon pour l'équipe de la
  boutique, bandeau "Aperçu" visible), publier/dépublier.
- **`/store/[slug]/pages/[pageSlug]`** : rendu public, uniquement les
  pages `status = 'published'` pour un visiteur anonyme (RLS
  `store_pages_select_public`, même principe que `products_select_
  public`).
- **Bloc "Formulaire"** (capture email) : jamais de policy insert
  ouverte sur `page_leads` — `capture_page_lead()` (SECURITY DEFINER)
  revérifie elle-même que la page existe et est publiée avant
  d'écrire, même discipline que `checkout_cart()`.
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (14/14) tous propres. Vérification en conditions réelles bloquée
  tant que le SQL n'a pas été collé (deux fichiers en attente :
  Phase 38 et Phase 39).

## 2026-09-10 — Phases 38 + 39 vérifiées en conditions réelles

SQL collé et confirmé pour les deux phases. Vérifié en direct sur le
site live : création d'un produit "Formation" (stock/poids bien
masqués, aucun impact sur l'affichage storefront), module + leçon
avec lien vidéo, garde d'activation (impossible d'activer sans leçon,
confirmé en conditions réelles — la première tentative de clic avait
échoué à cause d'un souci d'automatisation du navigateur, pas du code,
confirmé en retentant). Page Builder : page créée, les 15 blocs
présents dans le sélecteur, bloc Hero ajouté/édité/enregistré (persiste
après rechargement), publiée, rendu public vérifié en direct avec la
couleur d'accent de la boutique, aucune erreur console.

## 2026-09-10 — Phase 40 : Funnel Builder

Directive Section 14. Un funnel n'est jamais un nouveau système de
contenu : c'est un ordre nommé sur des pages (Page Builder) et des
produits déjà existants — LANDING/CAPTURE/VENTE sont des pages,
CHECKOUT est la fiche produit existante (le client clique "Ajouter au
panier" lui-même, aucun nouveau chemin de paiement créé), THANK YOU
est déjà la page de confirmation de commande. Seul ajout réel : le
suivi de visiteurs uniques par étape (directive : "prévoir des
statistiques par étape").

- **`funnels`** (store_id, name) → **`funnel_steps`** (position,
  step_type `page`|`product`, référence l'un ou l'autre jamais les
  deux à la fois — contrainte SQL). **`funnel_step_visits`** :
  dédoublonnée par `(funnel_step_id, visitor_key)` où `visitor_key`
  réutilise directement `auth.uid()` — jamais un nouveau cookie, tout
  visiteur boutique a déjà une session anonyme posée par
  `middleware.ts`.
- **`record_funnel_step_visit()`** appelée depuis les pages publiques
  existantes (page de vente ET fiche produit) au moment de l'affichage
  — journalise la visite pour chaque étape de funnel qui référence
  cette page/ce produit, jamais bloquant si aucune correspondance.
- **`/funnels`** : liste, création, éditeur (étapes ordonnées avec
  monter/descendre/supprimer, ajout d'une page ou d'un produit
  existant, lien "Voir" vers l'URL réelle de chaque étape, nombre de
  visiteurs uniques par étape).
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (14/14) tous propres. Vérification en conditions réelles bloquée
  tant que le SQL n'a pas été collé.

## 2026-09-10 — Phase 40 vérifiée en conditions réelles

SQL collé et confirmé. Vérifié en direct : création d'un funnel,
ajout d'une étape (page existante), compteur "0 visiteur unique" →
visite réelle de la page publique → rechargement de l'éditeur →
"1 visiteur unique". Le mécanisme de suivi (RPC appelée depuis les
pages publiques, agrégée via get_funnel_step_stats) fonctionne de
bout en bout.

## 2026-09-10 — Phase 41 : Order Bump

Directive Section 15. Offre complémentaire cochable au checkout
("+ Ebook : 2 000 F" si le panier contient le produit déclencheur).

- **`order_bumps`** (store_id, trigger_product_id, bump_product_id,
  headline, description, is_active) — RLS lecture publique limitée
  aux offres actives (même principe que `products_select_public`).
- **`checkout_cart()`** ré-créée (seule différence avec la version
  précédente : accepte `p_bump_product_ids`) — chaque bump soumis par
  le client n'est ajouté à la commande que s'il existe réellement une
  offre active pour un produit réellement présent dans CE panier, et
  toujours au prix actuel du produit en base, jamais un montant
  envoyé par le client. Stock décrémenté pour un bump physique, comme
  n'importe quel article.
- **`/store/[slug]/checkout`** : case à cocher par offre trouvée pour
  le panier courant, prix affiché, jamais pré-cochée.
- **`/order-bumps`** : gestion marchand (créer/activer-désactiver/
  supprimer une paire produit déclencheur → offre).
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (14/14) tous propres. Vérification en conditions réelles bloquée
  tant que le SQL n'a pas été collé.

## 2026-09-10 — Phase 41 vérifiée en conditions réelles

SQL collé et confirmé. Order bump créé en direct (Formation Test QA
→ Ebook Test QA) : liste correcte, prix résolu depuis le produit en
base (1 000,00 €), statut "Actif" par défaut.

## 2026-09-10 — Phase 42 : Upsell / Downsell

Directive Section 16 : "Ne jamais contourner le processus de
paiement." Contrairement à un vrai one-click upsell (rechargerait une
carte enregistrée sans repasser par le PSP — capacité qu'aucune
intégration de ce projet n'a), accepter une offre crée toujours une
VRAIE nouvelle commande séparée (`orders.parent_order_id`),
`payment_status = 'pending'` comme n'importe quelle commande, qui
repasse par le même vrai parcours de paiement (`/payer` si un PSP est
actif). Configuré par produit déclencheur, comme l'Order Bump — les
funnels de cette app n'ont pas de "checkout" propre à eux.

- **`upsell_offers`** (trigger_product_id → upsell_product_id, +
  downsell_product_id optionnel). **`orders.parent_order_id`** +
  **`orders.upsell_resolved_at`** — une commande née d'une offre
  acceptée est marquée résolue dès sa création (jamais de deuxième
  offre en cascade, protection contre un enchaînement A→B→A mal
  configuré qui ballotterait le client sans fin).
- **RLS** : la nouvelle commande n'a ni `cart_id` ni forcément de
  compte client réel (un invité n'a pas de mot de passe) — nouveau
  chemin de propriété `parent_order_id` + `is_order_owner()` réutilisée
  (Phase 37), toujours SECURITY DEFINER donc aucun cycle RLS.
- **`accept_upsell_offer()`** / **`decline_upsell_offer()`**
  revérifient elles-mêmes l'offre et l'ownership de la commande —
  jamais un produit/prix fourni par le client.
- **`/commande/[orderId]`** intercepte désormais vers
  `/commande/[orderId]/upsell` s'il existe une offre non résolue,
  avant même d'afficher la confirmation — jamais après. La page
  upsell affiche l'upsell, puis le downsell si refusé (aucun s'il n'y
  en a pas configuré), jamais bloquante si aucune offre.
- **`/upsells`** : gestion marchand (déclencheur → upsell + downsell
  optionnel, titres personnalisables, activer/désactiver/supprimer).
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (14/14) tous propres. Vérification en conditions réelles bloquée
  tant que le SQL n'a pas été collé.

## 2026-09-10 — Phase 42 vérifiée en conditions réelles

SQL collé et confirmé. Offre créée en direct (Formation Test QA →
Ebook Test QA, titre personnalisé) : liste correcte, la jointure à
trois FK vers `products` (déclencheur/upsell/downsell) résout
correctement chaque nom.

## 2026-09-10 — Phase 43 : CRM avancé (segmentation RFM)

Directive Section 17 : segmentation dynamique, récence/fréquence/
montant, clients VIP/inactifs/à risque/nouveaux — "basée sur les
données réelles".

- **`get_customer_rfm()`** (SQL) : agrège commandes par client pour
  une boutique (nombre, montant total, première/dernière commande).
  Le score (quintiles 1-5) et le classement en segment se calculent
  côté application (`lib/data/crm.ts`), jamais avec un seuil absolu
  identique pour toutes les boutiques — une boutique qui vend à
  2 000 F et une autre à 2 000 000 F obtiennent chacune leurs propres
  quintiles cohérents avec leur propre distribution réelle.
- **Segments** : Nouveau (1 commande, ≤ 30 jours), VIP (R/F/M tous
  ≥ 4/5), À risque (récence faible mais fréquence ou montant élevés
  auparavant), Inactif (récence très faible), Actif (le reste). Un
  client sans commande garde son badge Client/Prospect existant —
  aucune donnée réelle à segmenter pour lui.
- **`/clients`** : filtres de segment cliquables avec compteur réel,
  colonnes Segment/Commandes ajoutées ; le filtrage s'applique avant
  la pagination (nécessite désormais de charger tous les clients de
  l'organisation pour calculer les quintiles correctement, plafonné à
  2000 — au-delà, la pagination reste correcte mais les quintiles
  n'incluraient pas les clients supplémentaires).
- **`/clients/[id]`** : badge de segment et date de dernière commande
  ajoutés aux statistiques existantes.
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (14/14) tous propres. Vérification en conditions réelles bloquée
  tant que le SQL n'a pas été collé.

## 2026-09-11 — Phase 44 : Email marketing réel (Resend)

Directive Section 18 : "Le système actuel ne doit pas prétendre
envoyer des emails marketing s'il n'existe pas de provider réel."
Jusqu'ici, "Envoyer" une campagne ne faisait qu'enregistrer les
destinataires ciblés — honnête (le message le disait), mais jamais
un vrai envoi. Terrain préparé comme pour chaque provider de
paiement (Phase 35B) : toute l'architecture est construite dès
maintenant, l'utilisateur connecte sa PROPRE clé Resend plus tard
via les paramètres en libre-service — jamais de credentials
inventés par l'assistant.

- **`email_provider_settings`** (par organisation, comme le CRM) :
  clé API Resend, email/nom d'expéditeur, actif ou non. RLS
  admin/propriétaire uniquement, même principe que
  `payment_providers` — une clé API est un secret, jamais lisible
  par un simple membre.
- **`get_customer_rfm_by_org()`** : variante organisation entière de
  la RFM de la Phase 43 (`get_customer_rfm_by_org` en SQL,
  `getCustomerRfmMapByOrg()` côté app, quintiles calculés par la même
  fonction partagée `computeRfmSegments()`) — nécessaire car les
  campagnes ciblent déjà tous les clients de l'organisation, pas
  d'une seule boutique.
- **`campaigns.audience_segment`** : cible additionnelle par segment
  RFM (Nouveau/VIP/À risque/Inactif/Actif), en plus des tags/statut
  existants — prioritaire si renseigné.
- **`campaign_recipients`** gagne `status`/`error_message`/`sent_at`
  (la Phase 7 ne loggait que "ciblé", jamais un vrai statut d'envoi)
  + la policy UPDATE manquante pour les écrire après l'appel Resend.
- **`lib/email/resend.ts`** : envoi par lots de 100 max (contrat
  officiel Resend vérifié sur leur documentation avant écriture,
  jamais deviné), un `to` individuel par email — un destinataire ne
  voit jamais l'adresse d'un autre. Résultat succès/échec par email.
- **`sendCampaign()`** : si `email_provider_settings.is_active` est
  vrai pour l'organisation ET que le canal est email, envoie
  réellement via Resend et marque chaque destinataire sent/failed ;
  sinon, comportement simulé de la Phase 7 strictement inchangé (même
  message honnête "aucun message réel n'a été envoyé"). Jamais de
  faux "envoyé" sans provider actif.
- **`/campagnes/parametres`** : page admin-only (clé API masquée à
  l'enregistrement, champ vide conserve la clé existante — même
  discipline que `PaymentProviderCard`).
- **`components/campagnes/CampaignForm.tsx`** : nouveau sélecteur de
  segment CRM ; `SEGMENT_LABELS`/`CustomerSegment` déplacés dans
  `lib/data/segments.ts` (sans dépendance au client Supabase serveur)
  pour rester importables depuis ce composant client.
- **`/campagnes/[id]`** : distingue désormais "Envoi réel effectué via
  Resend" (avec compteurs sent/failed réels) de "Envoi simulé".
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (14/14) tous propres. Vérification en conditions réelles bloquée
  tant que le SQL n'a pas été collé (et l'envoi réel restera simulé
  tant que l'utilisateur n'aura pas connecté sa propre clé Resend).

## 2026-09-11 — Phases 43 et 44 vérifiées en conditions réelles

SQL collé et confirmé (les deux phases). Compte de test + boutique
dédiés créés (`Phase44 QA Store`), un produit et une vraie commande
invité passés pour obtenir un client réel avec des données RFM.

- **Phase 43** : `/clients` affiche correctement le segment "Nouveau"
  pour le client de test (1 commande, ≤ 30 jours), compteurs des
  pastilles de filtre exacts (Tous 1, Nouveaux 1, autres 0), filtre
  `?segment=new` fonctionnel.
- **Phase 44** : `/campagnes/parametres` enregistre et masque
  correctement la clé Resend (le champ redevient "••••••••" après
  enregistrement, jamais la valeur réelle) ; laisser le champ vide et
  ré-enregistrer conserve bien la clé existante (`is_active` reste
  activé). Sélecteur de segment CRM présent et fonctionnel dans le
  formulaire de campagne.
- **Bug réel trouvé et corrigé** : `SendCampaignButton` affichait
  toujours "Envoyer (simulation)" et le message de confirmation
  d'envoi simulé, même provider actif — texte figé depuis la Phase 7,
  jamais mis à jour par la Phase 44. Calcule désormais `isRealSend`
  côté page et adapte le libellé/la confirmation ; corrigé, commité
  (`a6c13a7`), redéployé et reconfirmé en direct (le bouton affiche
  bien "Envoyer" sans la mention simulation une fois un provider actif).
- Limite d'outillage documentée : le clic final sur "Envoyer" ouvre une
  boîte de dialogue native `window.confirm()` qui bloque l'automation
  du navigateur (comportement déjà rencontré en Phase 37/38) — tout le
  reste du parcours (sauvegarde des paramètres, ciblage, libellés
  honnêtes, code d'envoi Resend avec gestion d'erreur) est vérifié ;
  seul le clic de confirmation final n'a pas pu l'être par automation.

## 2026-09-11 — Phase 45 : SMS / WhatsApp réels (Twilio)

Directive Section 19, même discipline que la Phase 44 (Section 18) :
jamais de faux "envoyé" sans provider réel. Twilio expose une seule
API pour SMS et WhatsApp (même endpoint `Messages.json`, un simple
préfixe `whatsapp:` sur `From`/`To` distingue les deux canaux — vérifié
sur la documentation officielle Twilio avant écriture), donc un seul
compte/provider couvre les deux canaux déjà proposés dans le sélecteur
de canal des campagnes (Phase 7). Terrain préparé comme pour Resend :
l'utilisateur connectera son propre compte Twilio plus tard.

- **`messaging_provider_settings`** (par organisation) : Account SID,
  Auth Token, numéro d'envoi SMS, numéro d'envoi WhatsApp, actif ou
  non. RLS admin/propriétaire uniquement, même principe que
  `email_provider_settings`. Aucune nouvelle colonne sur
  `campaign_recipients` : `status`/`error_message`/`sent_at` (Phase 44)
  sont déjà génériques à tout canal.
- **`lib/sms/twilio.ts`** : un appel HTTP par message (Twilio n'a pas
  d'API batch, contrairement à Resend), par lots de 10 en concurrence
  pour rester raisonnable côté rate limiting. `toWhatsappAddress()`
  ajoute le préfixe `whatsapp:` requis.
- **`sendCampaign()`** étendu : pour un canal `sms`/`whatsapp`, vérifie
  `messaging_provider_settings.is_active` + le numéro d'envoi du canal
  concerné, envoie réellement via Twilio aux clients ayant un
  téléphone enregistré, marque chaque destinataire sent/failed ; sinon
  comportement simulé inchangé. La branche email (Phase 44) reste
  strictement identique, juste réorganisée par canal.
- **`/campagnes/parametres`** renommée "Paramètres d'envoi" (le lien de
  nav portait déjà ce nom) : nouvelle carte "SMS / WhatsApp (Twilio)"
  à côté de la carte email existante, même discipline de masquage du
  secret (Auth Token) à l'enregistrement.
- **`/campagnes/[id]`** et le bouton d'envoi affichent désormais le nom
  du provider concerné par le canal de la campagne (Resend pour email,
  Twilio pour SMS/WhatsApp) plutôt qu'un texte figé sur Resend.
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (14/14) tous propres. Vérification en conditions réelles bloquée
  tant que le SQL n'a pas été collé (et l'envoi réel restera simulé
  tant que l'utilisateur n'aura pas connecté son propre compte Twilio).

## 2026-09-11 — Phase 45 vérifiée en conditions réelles

SQL collé et confirmé. `/campagnes/parametres` enregistre et persiste
correctement les identifiants Twilio (SID, numéros SMS/WhatsApp,
actif). Une campagne créée avec le canal SMS affiche bien "Envoyer"
sans la mention "(simulation)" une fois le provider actif — confirme
que le calcul `willSendReal` fonctionne aussi pour SMS/WhatsApp, pas
seulement pour email. Même limite d'outillage que la Phase 44 : le
clic final derrière la boîte `window.confirm()` n'a pas pu être forcé
par automation.

## 2026-09-12 — Phase 46 : Tracking (Meta Pixel / GA4 / GTM)

Directive Section 20. Contrairement aux Phases 44/45, un Pixel ID, un
Measurement ID GA4 ou un Container ID GTM ne sont pas des secrets —
systématiquement visibles dans le code source de toute page qui les
utilise (fonctionnement normal de ces plateformes). Simples colonnes
sur `stores`, protégées par la policy `stores_update_member` déjà en
place, aucune nouvelle RLS nécessaire.

- **`stores.meta_pixel_id` / `ga4_measurement_id` / `gtm_container_id`**
  — configurables par le marchand sur `/boutique/tracking`, jamais
  inventés, un champ vide désactive simplement ce tracking.
- **`components/store/tracking/TrackingScripts.tsx`** : injecte
  uniquement les scripts réellement configurés (`next/script`,
  `strategy="afterInteractive"`, cohérent avec l'intégration Kkiapay
  existante) — chaque plateforme fait sa propre PageView/page_view
  automatique via son snippet officiel.
- **`lib/tracking/events.ts`** : 4 événements e-commerce standards
  (ViewContent/view_item, AddToCart/add_to_cart,
  InitiateCheckout/begin_checkout, Purchase/purchase) poussés en
  parallèle vers GTM dataLayer, Meta Pixel (`fbq`) et GA4 (`gtag`) —
  chacun n'agit que si son script a été chargé (donc seulement si
  configuré), jamais un faux événement vers une plateforme non
  connectée.
- **Purchase jamais compté avant un paiement réellement confirmé** :
  déclenché uniquement si `order.paymentStatus === 'paid'` — tant
  qu'aucun PSP n'est branché sur une boutique, l'événement ne part
  jamais (même discipline que "ne jamais simuler un paiement comme
  réel", directive fondatrice du projet). Protection anti-double
  comptage par `sessionStorage` clé par commande (un rechargement de
  la page de confirmation ne recompte jamais le même achat).
- **`AddToCartForm`** : enveloppe client léger autour du
  `<form action={addToCart}>` existant (fiche produit) sans changer
  son fonctionnement — déclenche l'événement au clic, le vrai server
  action continue de s'exécuter normalement.
- **`/boutique/tracking`** : nouvelle page de personnalisation
  boutique (carte ajoutée à `/boutique`), aucun masquage de champ
  (ce ne sont pas des secrets).
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (20/20, dont un nouveau fichier de tests unitaires ajouté pour
  `getCurrentStore()`) tous propres. Vérification en conditions
  réelles bloquée tant que le SQL n'a pas été collé (nécessite aussi
  de vrais identifiants Meta/Google pour observer des événements dans
  ces plateformes — seule l'injection conditionnelle des scripts et
  l'absence d'erreur console sont vérifiables ici).

## 2026-09-12 — Phase 46 vérifiée en conditions réelles

SQL collé et confirmé. `/boutique/tracking` enregistre et persiste
les trois identifiants. Sur le storefront : `window.fbq`/`window.gtag`
bien définis, script GTM et script GA4 présents dans le DOM,
`dataLayer` peuplé (`gtm.js`, `config`, `gtm.dom`, `gtm.load`). La
visite d'une fiche produit pousse bien un événement `view_item` avec
le bon produit/prix/devise dans `dataLayer`. Ajout au panier vérifié
fonctionnellement intact (le flux serveur n'est pas perturbé par
`AddToCartForm`) ; l'événement lui-même n'a pas pu être inspecté
directement (déclenché juste avant une navigation complète de page,
donc invisible après coup) mais partage le même code éprouvé que
`view_item`.

## 2026-09-12 — Phase 47 : Programme d'affiliation

Directive Section 21 — distinct du parrainage client (Phase 28,
points de fidélité entre clients) : ici, un partenaire EXTERNE reçoit
un lien unique et gagne une VRAIE commission calculée côté serveur,
jamais un montant fourni par le client. Le versement réel de la
commission reste manuel (hors de l'application) — BYA Flow calcule et
affiche ce qui est dû, ne simule jamais un paiement sortant.

- **`affiliates`** (par boutique, comme les order bumps/upsells) :
  nom, email, taux de commission (0-100%), statut actif/suspendu. Pas
  de colonne `code` stockée : dérivée à la volée du hash de l'id
  (`upper(substr(md5(id::text),1,8))`), exactement le même principe
  sans gestion de collision que `get_my_referral_code()` (Phase 28) —
  côté app, `lib/data/affiliates.ts` calcule le même hash via
  `crypto.createHash('md5')` (Node), garanti identique caractère pour
  caractère à `md5()` Postgres pour une chaîne ASCII (un UUID).
- **`resolve_affiliate_code()`** : même mécanique d'attribution que le
  parrainage — cookie `bya_aff` posé par le middleware dès la visite
  de `?aff=CODE`, résolu en id d'affilié seulement à la création du
  panier (`ensureCart()` dans `lib/actions/publicCart.ts`), jamais
  fourni par le client au paiement.
- **`checkout_cart()` ré-créée** : revérifie que l'affilié est
  toujours ACTIF au moment du paiement (pas seulement au clic sur le
  lien — un partenaire suspendu entre-temps ne génère plus de
  commission), calcule la commission sur le sous-total réel final
  (après order bumps), l'enregistre sur `orders.affiliate_commission`.
  Contrairement au bonus de parrainage, la commission s'applique à
  CHAQUE commande apportée par le lien, pas seulement au premier achat
  du client — modèle d'affiliation marketing standard, pas un
  programme anti-abus entre clients.
- **`/affiliation`** : CRUD marchand (créer/suspendre/supprimer),
  lien de suivi copiable par affilié, statistiques réelles calculées
  depuis `orders` (commandes apportées, ventes totales, commission
  due) — jamais un chiffre inventé.
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (20/20) tous propres. Vérification en conditions réelles bloquée
  tant que le SQL n'a pas été collé.

## 2026-09-12 — Phase 47 vérifiée en conditions réelles

SQL collé et confirmé. Affilié créé (15% de commission), lien copié
(`?aff=2336F9C6`), visite du lien → ajout au panier → commande réelle
passée : attribution correcte (1 commande apportée) et commission
exacte (25,00 € × 15 % = 3,75 €) affichées sur `/affiliation`. Confirme
au passage que le hash MD5 calculé côté app (Node `crypto`) correspond
bien caractère pour caractère à `md5()` Postgres — sans ce alignement,
`resolve_affiliate_code()` n'aurait jamais retrouvé l'affilié.

## 2026-09-12 — Phase 48 : Recommandations produits

Directive Section 22 : recommandations basées sur les VRAIES commandes
passées, jamais un algorithme inventé ou un tri aléatoire présenté
comme une recommandation.

- **`get_related_products(p_product_id, p_limit)`** (SQL, SECURITY
  DEFINER) : compte, pour chaque autre produit actif, le nombre de
  commandes distinctes où il apparaît avec le produit consulté — les
  vrais "souvent achetés ensemble". Appelable depuis la boutique
  publique (visiteur anonyme) sans exposer aucune commande ou client
  individuel : ne renvoie qu'une agrégation (produit, compteur), RLS
  contournée en interne comme toute fonction SECURITY DEFINER de ce
  projet, jamais un accès direct à `orders`/`order_items`.
- **`getRelatedProducts()`** (`lib/data/publicStore.ts`) : si aucune
  commande commune n'existe encore (boutique neuve), repli honnête sur
  "autres produits de la boutique" — jamais présenté comme "souvent
  achetés ensemble" s'il n'y a pas de données réelles derrière
  (`basedOnPurchases: false` change le titre affiché : "Vous pourriez
  aussi aimer" vs "Souvent achetés ensemble").
- **`components/store/RelatedProducts.tsx`** : nouvelle section sur la
  fiche produit, entre le bloc principal et les avis clients.
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (20/20) tous propres. Vérification en conditions réelles bloquée
  tant que le SQL n'a pas été collé.

## 2026-09-12 — Phase 48 vérifiée en conditions réelles

SQL collé et confirmé. Second produit créé dans la boutique de test :
avant tout achat commun, la fiche du premier produit affiche bien le
repli honnête "Vous pourriez aussi aimer". Après une commande réelle
contenant les deux produits, la même fiche affiche désormais "Souvent
achetés ensemble" avec le bon produit — confirme que `basedOnPurchases`
bascule correctement dès qu'une vraie donnée de co-achat existe.

## 2026-09-12 — Phase 49 : BYA AI — Assistant conversationnel

Directive Section 23. Aucun fournisseur LLM n'est connecté (ni
inventé) — même discipline que le `heuristicProvider` déjà en place
pour la génération de contenu (Phases produits/campagnes) : "aucun
appel externe, aucune clé API requise... pour rester utile dès
aujourd'hui sans connecter un fournisseur IA payant sans nécessité."
Un vrai LLM (OpenAI, Anthropic via Vercel AI Gateway...) pourra un
jour implémenter la même interface `AIProvider` et remplacer ce
provider sans changer le reste de l'application — terrain préparé,
mais fonctionnel dès maintenant sans dépendance externe.

- **`AIProvider.chat(message, context)`** : nouvelle méthode sur
  l'interface existante. Le `ChatContext` porte uniquement des VRAIES
  données déjà calculées ailleurs dans l'app (chiffre d'affaires 30j,
  commandes, panier moyen, nouveaux clients, produit le plus vendu,
  BYA Flow Score, comptes de segments RFM VIP/à risque) — jamais un
  chiffre inventé.
- **`lib/data/assistantContext.ts`** : réutilise `getGrowthScore()`
  (Phase IA existante) et `getCustomerRfmMap()` (Phase 43) plutôt que
  de recalculer une troisième fois la même chose.
- **`heuristicProvider.chat()`** : reconnaît par mots-clés un petit
  ensemble de questions courantes (chiffre d'affaires, commandes,
  produit le plus vendu, clients VIP/à risque, nouveaux clients,
  score) et répond toujours à partir du contexte réel ; pour toute
  autre question, le dit honnêtement plutôt que d'improviser une
  réponse plausible mais fausse.
- **`components/ia/AssistantChat.tsx`** sur `/ia` : chat simple
  (historique de messages, suggestions de questions), appelle
  `askAssistant()` (server action) directement depuis le client via
  `useTransition`, même schéma que la génération de contenu IA
  existante (`CampaignForm.tsx`).
- Aucune migration SQL nécessaire (aucun nouveau schéma, uniquement
  de la lecture de données déjà exposées ailleurs dans l'app).
- Vérifié : `next build`, `next lint`, `tsc --noEmit`, `npm test`
  (20/20) tous propres.
