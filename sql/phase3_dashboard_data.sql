-- BYA Flow — Phase 3 : données minimales pour le tableau de bord
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase2_auth_multitenant.sql.
--
-- Schéma volontairement minimal : juste assez pour calculer les indicateurs
-- du tableau de bord honnêtement (zéro donnée fictive). Les colonnes complètes
-- (variantes, images, SKU, adresses de livraison, etc.) arrivent en Phase 4
-- (Boutique/Produits) et Phase 5 (Commandes/Clients).

-- =========================================================
-- Tables
-- =========================================================

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric(12, 2) not null default 0
);

-- =========================================================
-- Fonctions d'accès (SECURITY DEFINER, même logique que Phase 2 :
-- éviter toute récursion RLS lors des vérifications d'appartenance)
-- =========================================================

create or replace function is_store_member(p_store_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from stores
    where stores.id = p_store_id
      and is_org_member(stores.organization_id)
  );
$$;

create or replace function is_order_member(p_order_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from orders
    where orders.id = p_order_id
      and is_store_member(orders.store_id)
  );
$$;

-- =========================================================
-- RLS
-- =========================================================

alter table customers enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "customers_select_member" on customers
  for select using (is_org_member(organization_id));

create policy "products_select_member" on products
  for select using (is_store_member(store_id));

create policy "orders_select_member" on orders
  for select using (is_store_member(store_id));

create policy "order_items_select_member" on order_items
  for select using (is_order_member(order_id));

-- Pas de policy d'insertion/mise à jour pour l'instant : la création de
-- clients/produits/commandes arrive avec leurs écrans dédiés en Phase 4/5.
