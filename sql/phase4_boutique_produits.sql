-- BYA Flow — Phase 4 : boutique (personnalisation) + produits complets
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase3_dashboard_data.sql.

-- =========================================================
-- Boutique : personnalisation
-- =========================================================

alter table stores add column if not exists description text;
alter table stores add column if not exists logo_url text;
alter table stores add column if not exists slug text;

update stores
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 8)
where slug is null;

create unique index if not exists stores_slug_key on stores (slug);

-- =========================================================
-- Catégories
-- =========================================================

create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (store_id, slug)
);

-- =========================================================
-- Produits : colonnes complètes
-- =========================================================

alter table products add column if not exists slug text;
alter table products add column if not exists description text;
alter table products add column if not exists compare_at_price numeric(12, 2);
alter table products add column if not exists sku text;
alter table products add column if not exists stock integer not null default 0;
alter table products add column if not exists weight numeric(10, 3);
alter table products add column if not exists category_id uuid references product_categories(id) on delete set null;
alter table products add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table products add column if not exists status text not null default 'draft'
  check (status in ('draft', 'active', 'archived'));

update products
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 8)
where slug is null;

alter table products alter column slug set not null;
create unique index if not exists products_store_slug_key on products (store_id, slug);

alter table products drop column if exists is_active;

-- =========================================================
-- Images produit
-- =========================================================

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Variantes produit
-- =========================================================

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  price numeric(12, 2),
  compare_at_price numeric(12, 2),
  sku text,
  stock integer not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Fonctions d'accès supplémentaires (même logique SECURITY DEFINER
-- anti-récursion RLS que les phases précédentes)
-- =========================================================

create or replace function is_product_member(p_product_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from products
    where products.id = p_product_id
      and is_store_member(products.store_id)
  );
$$;

-- =========================================================
-- RLS
-- =========================================================

alter table product_categories enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;

create policy "product_categories_select_member" on product_categories
  for select using (is_store_member(store_id));
create policy "product_categories_insert_member" on product_categories
  for insert with check (is_store_member(store_id));
create policy "product_categories_update_member" on product_categories
  for update using (is_store_member(store_id));
create policy "product_categories_delete_member" on product_categories
  for delete using (is_store_member(store_id));

create policy "products_insert_member" on products
  for insert with check (is_store_member(store_id));
create policy "products_update_member" on products
  for update using (is_store_member(store_id));
create policy "products_delete_member" on products
  for delete using (is_store_member(store_id));

create policy "product_images_select_member" on product_images
  for select using (is_product_member(product_id));
create policy "product_images_insert_member" on product_images
  for insert with check (is_product_member(product_id));
create policy "product_images_update_member" on product_images
  for update using (is_product_member(product_id));
create policy "product_images_delete_member" on product_images
  for delete using (is_product_member(product_id));

create policy "product_variants_select_member" on product_variants
  for select using (is_product_member(product_id));
create policy "product_variants_insert_member" on product_variants
  for insert with check (is_product_member(product_id));
create policy "product_variants_update_member" on product_variants
  for update using (is_product_member(product_id));
create policy "product_variants_delete_member" on product_variants
  for delete using (is_product_member(product_id));

-- =========================================================
-- Supabase Storage : images produit
-- =========================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_bucket_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_bucket_insert_member" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and is_store_member((storage.foldername(name))[1]::uuid)
  );

create policy "product_images_bucket_update_member" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and is_store_member((storage.foldername(name))[1]::uuid)
  );

create policy "product_images_bucket_delete_member" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and is_store_member((storage.foldername(name))[1]::uuid)
  );

-- =========================================================
-- Supabase Storage : logo boutique
-- =========================================================

insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

create policy "store_assets_bucket_public_read" on storage.objects
  for select using (bucket_id = 'store-assets');

create policy "store_assets_bucket_insert_member" on storage.objects
  for insert with check (
    bucket_id = 'store-assets'
    and is_store_member((storage.foldername(name))[1]::uuid)
  );

create policy "store_assets_bucket_update_member" on storage.objects
  for update using (
    bucket_id = 'store-assets'
    and is_store_member((storage.foldername(name))[1]::uuid)
  );

create policy "store_assets_bucket_delete_member" on storage.objects
  for delete using (
    bucket_id = 'store-assets'
    and is_store_member((storage.foldername(name))[1]::uuid)
  );
