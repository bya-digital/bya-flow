-- BYA Flow — Phase 9 : analytics
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase8_automatisations.sql.
--
-- La plupart des indicateurs analytics (CA, commandes, panier moyen,
-- évolution temporelle, meilleures ventes) se calculent déjà à partir de
-- orders/order_items/customers existants : la page /analytics ne fait que
-- les interroger sur une période choisie, aucune nouvelle table n'est
-- nécessaire pour cela.
--
-- Le "taux de conversion" est calculé honnêtement à partir de ce qui existe
-- réellement (paniers → commandes, Phase 7), et non à partir d'un trafic
-- visiteur fictif : BYA Flow n'a pas de boutique publique pour mesurer de
-- vraies visites.
--
-- `analytics_events` est créée ici pour préparer le terrain (traçage
-- d'événements futurs — visites d'une future boutique publique, actions
-- utilisateur pour la couche IA de la Phase 11...). Elle reste vide tant
-- qu'aucune source d'événements réelle n'existe : aucune donnée n'y est
-- insérée par ce script.

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table analytics_events enable row level security;

create policy "analytics_events_select_member" on analytics_events
  for select using (is_org_member(organization_id));

-- Pas de policy d'insertion pour les utilisateurs : réservée à de futures
-- sources d'événements système (à réévaluer quand un vrai producteur
-- d'événements existera).
