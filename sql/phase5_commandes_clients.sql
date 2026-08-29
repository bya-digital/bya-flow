-- BYA Flow — Phase 5 : commandes + clients (CRM)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase4_boutique_produits.sql.

-- =========================================================
-- Clients : fiche CRM complète
-- =========================================================

alter table customers add column if not exists phone text;
alter table customers add column if not exists tags text[] not null default '{}';
alter table customers add column if not exists notes text;
alter table customers add column if not exists status text not null default 'prospect'
  check (status in ('prospect', 'client'));
alter table customers add column if not exists updated_at timestamptz not null default now();

-- Le montant dépensé et la dernière activité se calculent à partir des
-- commandes au moment de la lecture, plutôt que d'être dupliqués ici
-- (évite tout risque de désynchronisation).

drop trigger if exists set_updated_at on customers;
create trigger set_updated_at before update on customers
  for each row execute function set_updated_at();

-- =========================================================
-- Commandes : paiement, expédition, numérotation
-- =========================================================

alter table orders add column if not exists order_number bigserial;
alter table orders add column if not exists payment_status text not null default 'pending'
  check (payment_status in ('pending', 'paid', 'refunded'));
alter table orders add column if not exists shipping_address jsonb;
alter table orders add column if not exists notes text;
alter table orders add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_updated_at on orders;
create trigger set_updated_at before update on orders
  for each row execute function set_updated_at();

-- =========================================================
-- RLS : écriture désormais ouverte (Phase 5 = premières vraies
-- opérations de vente), même logique SECURITY DEFINER qu'avant
-- =========================================================

create policy "customers_insert_member" on customers
  for insert with check (is_org_member(organization_id));
create policy "customers_update_member" on customers
  for update using (is_org_member(organization_id));
create policy "customers_delete_member" on customers
  for delete using (is_org_member(organization_id));

create policy "orders_insert_member" on orders
  for insert with check (is_store_member(store_id));
create policy "orders_update_member" on orders
  for update using (is_store_member(store_id));
-- Pas de policy de suppression sur orders : une commande se annule via son
-- statut ('cancelled'/'refunded'), jamais supprimée (intégrité comptable).

create policy "order_items_insert_member" on order_items
  for insert with check (is_order_member(order_id));
create policy "order_items_update_member" on order_items
  for update using (is_order_member(order_id));
create policy "order_items_delete_member" on order_items
  for delete using (is_order_member(order_id));
