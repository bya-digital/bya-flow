-- BYA Flow — Phase 31 : API & webhooks (v1)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase30 (aucune, la Phase 30 n'avait pas de SQL — après phase28_parrainage.sql).
--
-- Première tranche volontairement limitée : API en lecture seule
-- (produits, commandes), un seul événement de webhook (order.created).
-- L'écriture via API, d'autres événements, et un système de relance en
-- cas d'échec de livraison du webhook ne sont pas couverts ici.
--
-- Choix d'architecture important : ce projet n'utilise nulle part la clé
-- service_role (elle a été délibérément retirée de .env.example — la RLS
-- est l'unique frontière de sécurité, cf. PROGRES.md). L'authentification
-- par clé API et l'accès aux données passent donc, comme partout ailleurs
-- dans ce projet, par des fonctions SECURITY DEFINER appelées avec la clé
-- anon — jamais par un rôle qui contournerait globalement la RLS.

-- =========================================================
-- Clés API
-- =========================================================

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table api_keys enable row level security;

create policy "api_keys_select_admin" on api_keys
  for select using (is_org_admin(organization_id));
create policy "api_keys_insert_admin" on api_keys
  for insert with check (is_org_admin(organization_id) and created_by = auth.uid());
create policy "api_keys_update_admin" on api_keys
  for update using (is_org_admin(organization_id));

-- =========================================================
-- Webhooks
-- =========================================================

create table if not exists webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  url text not null,
  event text not null default 'order.created' check (event in ('order.created')),
  secret text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table webhook_endpoints enable row level security;

create policy "webhook_endpoints_select_admin" on webhook_endpoints
  for select using (is_org_admin(organization_id));
create policy "webhook_endpoints_insert_admin" on webhook_endpoints
  for insert with check (is_org_admin(organization_id));
create policy "webhook_endpoints_update_admin" on webhook_endpoints
  for update using (is_org_admin(organization_id));
create policy "webhook_endpoints_delete_admin" on webhook_endpoints
  for delete using (is_org_admin(organization_id));

-- =========================================================
-- Authentification API — le hash est calculé côté application (Node),
-- jamais la clé en clair transmise ou stockée par Postgres.
-- =========================================================

create or replace function api_authenticate(p_key_hash text)
returns table (organization_id uuid, scopes text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_org_id uuid;
  v_scopes text[];
begin
  select api_keys.id, api_keys.organization_id, api_keys.scopes
  into v_id, v_org_id, v_scopes
  from api_keys
  where api_keys.key_hash = p_key_hash and api_keys.revoked_at is null;

  if v_id is null then
    return;
  end if;

  update api_keys set last_used_at = now() where api_keys.id = v_id;

  organization_id := v_org_id;
  scopes := v_scopes;
  return next;
end;
$$;

-- =========================================================
-- Lecture — organization_id provient toujours de api_authenticate(),
-- jamais d'une valeur fournie telle quelle par l'appelant externe.
-- =========================================================

create or replace function api_list_products(
  p_organization_id uuid, p_limit integer default 50, p_offset integer default 0
)
returns table (
  id uuid, store_id uuid, name text, slug text, price numeric, stock integer,
  status text, created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.store_id, p.name, p.slug, p.price, p.stock, p.status, p.created_at
  from products p
  join stores s on s.id = p.store_id
  where s.organization_id = p_organization_id
  order by p.created_at desc
  limit least(p_limit, 100) offset greatest(p_offset, 0);
$$;

create or replace function api_get_product(p_organization_id uuid, p_product_id uuid)
returns table (
  id uuid, store_id uuid, name text, slug text, description text, price numeric,
  compare_at_price numeric, stock integer, status text, created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.store_id, p.name, p.slug, p.description, p.price, p.compare_at_price,
         p.stock, p.status, p.created_at
  from products p
  join stores s on s.id = p.store_id
  where s.organization_id = p_organization_id and p.id = p_product_id;
$$;

create or replace function api_list_orders(
  p_organization_id uuid, p_limit integer default 50, p_offset integer default 0
)
returns table (
  id uuid, store_id uuid, order_number bigint, status text, payment_status text,
  subtotal numeric, shipping_cost numeric, total numeric, created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select o.id, o.store_id, o.order_number, o.status, o.payment_status,
         o.subtotal, o.shipping_cost, o.total, o.created_at
  from orders o
  join stores s on s.id = o.store_id
  where s.organization_id = p_organization_id
  order by o.created_at desc
  limit least(p_limit, 100) offset greatest(p_offset, 0);
$$;

create or replace function api_get_order(p_organization_id uuid, p_order_id uuid)
returns table (
  id uuid, store_id uuid, order_number bigint, status text, payment_status text,
  subtotal numeric, shipping_cost numeric, total numeric, shipping_address jsonb,
  notes text, created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select o.id, o.store_id, o.order_number, o.status, o.payment_status,
         o.subtotal, o.shipping_cost, o.total, o.shipping_address, o.notes, o.created_at
  from orders o
  join stores s on s.id = o.store_id
  where s.organization_id = p_organization_id and o.id = p_order_id;
$$;

create or replace function api_get_order_items(p_organization_id uuid, p_order_id uuid)
returns table (product_id uuid, product_name text, quantity integer, unit_price numeric)
language sql
security definer
set search_path = public
stable
as $$
  select oi.product_id, p.name, oi.quantity, oi.unit_price
  from order_items oi
  join orders o on o.id = oi.order_id
  join stores s on s.id = o.store_id
  left join products p on p.id = oi.product_id
  where s.organization_id = p_organization_id and o.id = p_order_id;
$$;

-- =========================================================
-- Webhooks — endpoints actifs pour une boutique donnée. Jamais exposée
-- au client : appelée depuis submitCheckout() juste après une commande
-- réussie, avec l'id de boutique déjà connu (public de toute façon,
-- il apparaît dans l'URL /store/[slug]).
-- =========================================================

create or replace function get_active_order_webhooks(p_store_id uuid)
returns table (url text, secret text)
language sql
security definer
set search_path = public
stable
as $$
  select we.url, we.secret
  from webhook_endpoints we
  join stores s on s.organization_id = we.organization_id
  where s.id = p_store_id and we.is_active = true and we.event = 'order.created';
$$;
