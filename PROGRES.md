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
