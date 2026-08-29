-- BYA Flow — Phase 7 : marketing (campagnes, promotions/coupons, paniers abandonnés)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase5_commandes_clients.sql.

-- =========================================================
-- Nettoyage : tables orphelines de la Phase 1
-- =========================================================
-- `contacts`, `campaigns` (ancienne version) et `campaign_events` dataient
-- d'avant le multi-tenant : RLS activée sans policy, donc inaccessibles
-- depuis leur création (aucune ligne n'a jamais pu y être écrite ou lue).
-- On les remplace ici par une version de `campaigns` correctement rattachée
-- à une organisation.

drop table if exists campaign_events;
drop table if exists campaigns;
drop table if exists contacts;

-- =========================================================
-- Campagnes
-- =========================================================

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  subject text,
  content text,
  channel text not null default 'email' check (channel in ('email', 'sms', 'whatsapp')),
  audience_tags text[] not null default '{}',
  audience_status text check (audience_status in ('prospect', 'client')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Historique des destinataires ciblés au moment de l'envoi (simulé : aucun
-- fournisseur email/SMS/WhatsApp n'est connecté à ce stade, voir Phase 14+
-- du cahier des charges pour l'intégration réelle).
create table campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  created_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on campaigns;
create trigger set_updated_at before update on campaigns
  for each row execute function set_updated_at();

create or replace function is_campaign_member(p_campaign_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from campaigns
    where campaigns.id = p_campaign_id
      and is_org_member(campaigns.organization_id)
  );
$$;

alter table campaigns enable row level security;
alter table campaign_recipients enable row level security;

create policy "campaigns_select_member" on campaigns
  for select using (is_org_member(organization_id));
create policy "campaigns_insert_member" on campaigns
  for insert with check (is_org_member(organization_id));
create policy "campaigns_update_member" on campaigns
  for update using (is_org_member(organization_id));
create policy "campaigns_delete_member" on campaigns
  for delete using (is_org_member(organization_id));

create policy "campaign_recipients_select_member" on campaign_recipients
  for select using (is_campaign_member(campaign_id));
create policy "campaign_recipients_insert_member" on campaign_recipients
  for insert with check (is_campaign_member(campaign_id));

-- =========================================================
-- Promotions & coupons
-- =========================================================

create table coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  code text not null,
  type text not null default 'percentage' check (type in ('percentage', 'fixed')),
  value numeric(12, 2) not null,
  min_order_amount numeric(12, 2),
  usage_limit integer,
  usage_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, code)
);

drop trigger if exists set_updated_at on coupons;
create trigger set_updated_at before update on coupons
  for each row execute function set_updated_at();

alter table coupons enable row level security;

create policy "coupons_select_member" on coupons
  for select using (is_store_member(store_id));
create policy "coupons_insert_member" on coupons
  for insert with check (is_store_member(store_id));
create policy "coupons_update_member" on coupons
  for update using (is_store_member(store_id));
create policy "coupons_delete_member" on coupons
  for delete using (is_store_member(store_id));

-- Un coupon appliqué à une commande : on l'enregistre pour l'historique,
-- même si aucune UI de rapport dédiée n'est encore prévue.
alter table orders add column if not exists coupon_id uuid references coupons(id) on delete set null;
alter table orders add column if not exists discount_amount numeric(12, 2) not null default 0;

-- =========================================================
-- Paniers abandonnés
-- =========================================================
-- BYA Flow n'a pas encore de boutique publique (pas de Phase dédiée à ce
-- stade) : un panier se crée ici manuellement (devis, intérêt exprimé par
-- téléphone/en magasin...), pas via un parcours client en ligne. Les
-- relances automatiques (utilisant `last_reminder_at`) sont prévues pour la
-- Phase 8 (Automatisations) — ce panier ne fait qu'exposer la donnée.

create table carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'abandoned', 'converted')),
  notes text,
  last_reminder_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric(12, 2) not null default 0
);

drop trigger if exists set_updated_at on carts;
create trigger set_updated_at before update on carts
  for each row execute function set_updated_at();

create or replace function is_cart_member(p_cart_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from carts
    where carts.id = p_cart_id
      and is_store_member(carts.store_id)
  );
$$;

alter table carts enable row level security;
alter table cart_items enable row level security;

create policy "carts_select_member" on carts
  for select using (is_store_member(store_id));
create policy "carts_insert_member" on carts
  for insert with check (is_store_member(store_id));
create policy "carts_update_member" on carts
  for update using (is_store_member(store_id));
create policy "carts_delete_member" on carts
  for delete using (is_store_member(store_id));

create policy "cart_items_select_member" on cart_items
  for select using (is_cart_member(cart_id));
create policy "cart_items_insert_member" on cart_items
  for insert with check (is_cart_member(cart_id));
create policy "cart_items_update_member" on cart_items
  for update using (is_cart_member(cart_id));
create policy "cart_items_delete_member" on cart_items
  for delete using (is_cart_member(cart_id));
