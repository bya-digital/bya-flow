-- BYA Flow — Phase 35B : durcissement du Payment Engine (audit du 2026-09-10)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase36_supprimer_boutique.sql.
--
-- Ne connecte aucun nouveau PSP réel — prépare uniquement l'abstraction
-- (types, rôles, journalisation) conformément à la directive du
-- 2026-09-10 : "NE CODE PAS ENCORE UNE INTÉGRATION PRODUCTION
-- SPÉCIFIQUE À ORANGE MONEY, WAVE, CINETPAY, FLUTTERWAVE OU PAYSTACK."

-- ============================================================
-- 1. Trois nouveaux fournisseurs en terrain préparé (stubs) :
--    Flutterwave, CinetPay, Paystack — comme les 8 existants,
--    aucune API réelle appelée.
-- ============================================================
alter table payment_providers drop constraint if exists payment_providers_provider_check;
alter table payment_providers add constraint payment_providers_provider_check
  check (
    provider in (
      'orange_money', 'wave', 'mtn_money', 'moov_money',
      'chariow', 'maketou', 'ikeepay', 'kkiapay',
      'flutterwave', 'cinetpay', 'paystack'
    )
  );

-- ============================================================
-- 2. payment_status élargi (orders) : trop restreint pour couvrir
--    un vrai cycle de vie paiement (Section 7 de la directive).
--    payment_transactions.status gagne aussi 'partially_refunded'
--    pour rester cohérent avec orders.payment_status.
-- ============================================================
alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check
  check (payment_status in (
    'pending', 'processing', 'paid', 'failed',
    'cancelled', 'refunded', 'partially_refunded'
  ));

alter table payment_transactions drop constraint if exists payment_transactions_status_check;
alter table payment_transactions add constraint payment_transactions_status_check
  check (status in (
    'pending', 'processing', 'succeeded', 'failed',
    'cancelled', 'refunded', 'partially_refunded'
  ));

-- ============================================================
-- 3. Restriction des secrets de paiement aux admin/propriétaire
--    (audit Section H/F.5 : n'importe quel membre pouvait jusqu'ici
--    lire/écrire les clés API du compte PSP du marchand). Même
--    principe que is_store_member (Phase 3), mais exige le rôle
--    admin/owner comme is_org_admin (Phase 2).
-- ============================================================
create or replace function is_store_admin(p_store_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from stores
    where stores.id = p_store_id
      and is_org_admin(stores.organization_id)
  );
$$;

drop policy if exists "payment_providers_select_member" on payment_providers;
drop policy if exists "payment_providers_insert_member" on payment_providers;
drop policy if exists "payment_providers_update_member" on payment_providers;
drop policy if exists "payment_providers_delete_member" on payment_providers;

create policy "payment_providers_select_admin" on payment_providers
  for select using (is_store_admin(store_id));
create policy "payment_providers_insert_admin" on payment_providers
  for insert with check (is_store_admin(store_id));
create policy "payment_providers_update_admin" on payment_providers
  for update using (is_store_admin(store_id));
create policy "payment_providers_delete_admin" on payment_providers
  for delete using (is_store_admin(store_id));

-- Lecture non sensible (provider + actif/inactif seulement, jamais
-- config) pour qu'un simple membre continue de voir sur /paiements
-- quel moyen de paiement est en ligne, sans jamais pouvoir lire les
-- clés API — la RLS ci-dessus lui interdit désormais l'accès direct
-- à la table.
create or replace function get_store_active_payment_providers(p_store_id uuid)
returns table (provider text, is_active boolean)
language sql
security definer
set search_path = public
stable
as $$
  select pp.provider, pp.is_active
  from payment_providers pp
  where pp.store_id = p_store_id and is_store_member(p_store_id);
$$;

-- ============================================================
-- 4. Journalisation des webhooks entrants — protection anti-rejeu
--    et anti-doublon en amont de confirm_order_payment() (qui reste
--    idempotente elle-même, mais ne loggait rien et refaisait un
--    appel checkStatus() inutile à chaque livraison dupliquée).
-- ============================================================
create table if not exists payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  order_id uuid references orders(id) on delete set null,
  received_at timestamptz not null default now(),
  payload jsonb,
  unique (provider, event_id)
);

alter table payment_webhook_events enable row level security;
-- Aucune policy select/insert : jamais accédée directement par un
-- client (anon ou authentifié), uniquement via la fonction
-- SECURITY DEFINER ci-dessous, appelée depuis la route webhook.

-- Renvoie true si c'est un nouvel événement (à traiter), false s'il a
-- déjà été reçu (webhook rejoué ou livré deux fois par le PSP) — à
-- ignorer sans même rappeler checkStatus().
create or replace function record_payment_webhook_event(
  p_provider text,
  p_event_id text,
  p_order_id uuid,
  p_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into payment_webhook_events (provider, event_id, order_id, payload)
  values (p_provider, p_event_id, p_order_id, p_payload)
  on conflict (provider, event_id) do nothing;
  return found;
end;
$$;
