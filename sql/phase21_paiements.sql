-- BYA Flow — Phase 21 : terrain préparé pour les paiements (multi-fournisseur)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase20_livraison.sql.
--
-- IMPORTANT : cette phase ne connecte AUCUNE vraie API de paiement.
-- Elle pose l'architecture (schéma + interface TypeScript côté code,
-- voir lib/payments/) pour qu'un vrai fournisseur (Orange Money, Wave,
-- MTN Money, Moov Money, Chariow, Maketou, iKeepay, Kkiapay...) puisse
-- être branché plus tard sans migration de rattrapage. Le checkout
-- public n'utilise pas encore ces tables — aucun paiement n'est traité.

create table if not exists payment_providers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  provider text not null check (
    provider in (
      'orange_money', 'wave', 'mtn_money', 'moov_money',
      'chariow', 'maketou', 'ikeepay', 'kkiapay'
    )
  ),
  is_active boolean not null default false,
  -- Identifiants propres au commerçant pour son propre compte chez ce
  -- fournisseur (jamais des données bancaires de ses clients). Lisible
  -- uniquement par les membres de la boutique concernée (RLS ci-dessous).
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, provider)
);

drop trigger if exists set_updated_at on payment_providers;
create trigger set_updated_at before update on payment_providers
  for each row execute function set_updated_at();

create table if not exists payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
  amount numeric(12, 2) not null,
  currency text not null,
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on payment_transactions;
create trigger set_updated_at before update on payment_transactions
  for each row execute function set_updated_at();

alter table payment_providers enable row level security;
alter table payment_transactions enable row level security;

create policy "payment_providers_select_member" on payment_providers
  for select using (is_store_member(store_id));
create policy "payment_providers_insert_member" on payment_providers
  for insert with check (is_store_member(store_id));
create policy "payment_providers_update_member" on payment_providers
  for update using (is_store_member(store_id));
create policy "payment_providers_delete_member" on payment_providers
  for delete using (is_store_member(store_id));

create policy "payment_transactions_select_member" on payment_transactions
  for select using (is_order_member(order_id));
