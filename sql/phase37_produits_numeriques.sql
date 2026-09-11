-- BYA Flow — Phase 37 : produits numériques (téléchargement sécurisé)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase35b_payment_engine_hardening.sql.
--
-- Ebook/PDF/ZIP/logiciel/vidéo... vendus en téléchargement. Le fichier
-- vit dans un bucket Storage PRIVÉ (jamais public comme product-images) :
-- l'accès en lecture n'est jamais accordé par une URL publique mais par
-- une URL signée à durée de vie courte, générée uniquement après
-- vérification que l'appelant a bien payé sa commande — même discipline
-- que le reste du projet (payment_status jamais décidé côté client).

-- ============================================================
-- 1. Produits : type + fichier numérique
-- ============================================================
alter table products add column if not exists product_type text not null default 'physical'
  check (product_type in ('physical', 'digital'));
alter table products add column if not exists digital_file_path text;
alter table products add column if not exists digital_file_name text;
alter table products add column if not exists digital_file_size bigint;

-- ============================================================
-- 2. Journal des téléchargements (visibilité marchand + historique)
-- ============================================================
create table if not exists product_downloads (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

alter table product_downloads enable row level security;

create policy "product_downloads_select_member" on product_downloads
  for select using (
    exists (
      select 1 from order_items oi
      join orders o on o.id = oi.order_id
      where oi.id = product_downloads.order_item_id
        and is_store_member(o.store_id)
    )
  );
-- Aucune policy insert : uniquement via record_product_download()
-- (SECURITY DEFINER ci-dessous), jamais une écriture directe du client.

-- ============================================================
-- 3. Propriété d'une commande, unifiée (déjà deux chemins séparés :
--    panier invité via is_order_owner_anon, compte client via
--    is_order_owner_account) — réutilisée pour le contrôle d'accès
--    au fichier numérique.
-- ============================================================
create or replace function is_order_owner(p_order_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select is_order_owner_anon(p_order_id) or is_order_owner_account(p_order_id);
$$;

-- Lecture du fichier scopée à une ligne de commande précise (jamais au
-- produit seul) : exige payment_status = 'paid' ET que l'appelant
-- possède bien cette commande. Volontairement une fonction à part
-- (jamais products_select_public, qui ne couvre que status='active' —
-- un acheteur doit pouvoir retélécharger même si le produit a été
-- dépublié depuis).
create or replace function get_digital_file_for_download(p_order_item_id uuid)
returns table (file_path text, file_name text)
language sql
security definer
set search_path = public
stable
as $$
  select p.digital_file_path, p.digital_file_name
  from order_items oi
  join orders o on o.id = oi.order_id
  join products p on p.id = oi.product_id
  where oi.id = p_order_item_id
    and o.payment_status = 'paid'
    and is_order_owner(o.id)
    and p.digital_file_path is not null;
$$;

create or replace function record_product_download(p_order_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_authorized boolean;
begin
  select exists (
    select 1 from order_items oi
    join orders o on o.id = oi.order_id
    where oi.id = p_order_item_id
      and o.payment_status = 'paid'
      and is_order_owner(o.id)
  ) into v_authorized;

  if not v_authorized then
    return false;
  end if;

  insert into product_downloads (order_item_id) values (p_order_item_id);
  return true;
end;
$$;

-- Type de produit par ligne de commande, pour une commande que
-- l'appelant possède — jamais via products_select_public (limitée à
-- status='active'), pour qu'un acheteur puisse toujours voir/retélécharger
-- un produit numérique même si le marchand l'a dépublié depuis.
create or replace function get_order_item_product_types(p_order_id uuid)
returns table (order_item_id uuid, product_type text)
language sql
security definer
set search_path = public
stable
as $$
  select oi.id, p.product_type
  from order_items oi
  join products p on p.id = oi.product_id
  where oi.order_id = p_order_id and is_order_owner(p_order_id);
$$;

-- Vraie barrière de sécurité pour le fichier lui-même : même un appel
-- direct à createSignedUrl() (sans passer par get_digital_file_for_download)
-- reste bloqué ici si l'acheteur n'a pas payé cet exact produit.
create or replace function customer_has_paid_digital_access(p_product_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from order_items oi
    join orders o on o.id = oi.order_id
    where oi.product_id = p_product_id
      and o.payment_status = 'paid'
      and is_order_owner(o.id)
  );
$$;

-- ============================================================
-- 4. Stock : jamais pertinent pour un produit numérique (quantité
--    illimitée par nature) — checkout_cart() et create_pos_order()
--    ré-créées avec la seule différence : le contrôle/décrément de
--    stock ne s'applique plus qu'aux produits physiques. Reste du
--    corps identique à la version précédente (Phase 28 / Phase 33).
-- ============================================================
create or replace function checkout_cart(
  p_cart_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_shipping jsonb,
  p_notes text,
  p_shipping_method_id uuid default null,
  p_redeem_points integer default 0
)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart carts;
  v_store stores;
  v_customer_id uuid;
  v_subtotal numeric(12, 2) := 0;
  v_shipping_cost numeric(12, 2) := 0;
  v_shipping_name text := null;
  v_method shipping_methods;
  v_order orders;
  v_item record;
  v_balance integer := 0;
  v_redeem_points integer := 0;
  v_loyalty_discount numeric(12, 2) := 0;
  v_earned_points integer := 0;
  v_is_first_order boolean := false;
  v_referrer_id uuid;
  v_welcome_bonus integer := 0;
  v_referral_eligible boolean := false;
begin
  if p_email is null or btrim(p_email) = '' then
    raise exception 'Email requis.';
  end if;

  select * into v_cart from carts
  where id = p_cart_id and anon_user_id = auth.uid() and status = 'active';
  if v_cart.id is null then
    raise exception 'Panier introuvable.';
  end if;

  select * into v_store from stores where id = v_cart.store_id and is_active = true;
  if v_store.id is null then
    raise exception 'Boutique indisponible.';
  end if;

  if not exists (select 1 from cart_items where cart_id = v_cart.id) then
    raise exception 'Le panier est vide.';
  end if;

  for v_item in
    select ci.product_id, ci.quantity, ci.unit_price, p.stock, p.status as product_status, p.product_type
    from cart_items ci
    join products p on p.id = ci.product_id
    where ci.cart_id = v_cart.id
  loop
    if v_item.product_status <> 'active' then
      raise exception 'Stock insuffisant pour un des produits du panier.';
    end if;
    if v_item.product_type = 'physical' and v_item.stock < v_item.quantity then
      raise exception 'Stock insuffisant pour un des produits du panier.';
    end if;
    v_subtotal := v_subtotal + (v_item.unit_price * v_item.quantity);
  end loop;

  if p_shipping_method_id is not null then
    select * into v_method from shipping_methods
    where id = p_shipping_method_id and store_id = v_cart.store_id and is_active = true;
    if v_method.id is null then
      raise exception 'Méthode de livraison indisponible.';
    end if;
    v_shipping_name := v_method.name;
    if v_method.free_above is not null and v_subtotal >= v_method.free_above then
      v_shipping_cost := 0;
    else
      v_shipping_cost := v_method.price;
    end if;
  end if;

  select id into v_customer_id
  from customers
  where organization_id = v_store.organization_id and email = p_email
  limit 1;

  if v_customer_id is null then
    insert into customers (organization_id, email, full_name, phone, status)
    values (v_store.organization_id, p_email, p_full_name, p_phone, 'client')
    returning id into v_customer_id;
  else
    update customers
    set full_name = coalesce(p_full_name, full_name),
        phone = coalesce(p_phone, phone),
        status = 'client'
    where id = v_customer_id;
  end if;

  if v_store.loyalty_enabled and coalesce(p_redeem_points, 0) > 0 then
    if auth.email() is null or lower(auth.email()) <> lower(p_email) then
      raise exception 'Connectez-vous avec votre compte pour utiliser vos points de fidélité.';
    end if;

    select coalesce(sum(points_delta), 0) into v_balance
    from loyalty_ledger
    where store_id = v_store.id and customer_id = v_customer_id;

    v_redeem_points := least(
      p_redeem_points,
      greatest(v_balance, 0),
      floor(v_subtotal / nullif(v_store.loyalty_redeem_value, 0))::integer
    );
    if v_redeem_points > 0 then
      v_loyalty_discount := v_redeem_points * v_store.loyalty_redeem_value;
    end if;
  end if;

  v_referrer_id := v_cart.referred_by_customer_id;
  v_is_first_order := not exists (
    select 1 from orders where orders.customer_id = v_customer_id and orders.store_id = v_store.id
  );
  v_referral_eligible :=
    v_store.loyalty_enabled and v_store.referral_enabled
    and v_referrer_id is not null and v_referrer_id <> v_customer_id
    and v_is_first_order;

  if v_referral_eligible and v_store.referral_welcome_points > 0 then
    v_welcome_bonus := v_store.referral_welcome_points;
  end if;

  insert into orders (
    store_id, customer_id, cart_id, status, payment_status, shipping_address, notes,
    subtotal, shipping_method_id, shipping_method_name, shipping_cost,
    loyalty_points_redeemed, loyalty_discount, total
  )
  values (
    v_cart.store_id, v_customer_id, v_cart.id, 'pending', 'pending', p_shipping, p_notes,
    v_subtotal, p_shipping_method_id, v_shipping_name, v_shipping_cost,
    v_redeem_points, v_loyalty_discount, v_subtotal - v_loyalty_discount + v_shipping_cost
  )
  returning * into v_order;

  insert into order_items (order_id, product_id, quantity, unit_price)
  select v_order.id, ci.product_id, ci.quantity, ci.unit_price
  from cart_items ci
  where ci.cart_id = v_cart.id;

  update products p
  set stock = p.stock - ci.quantity
  from cart_items ci
  where ci.cart_id = v_cart.id and p.id = ci.product_id and p.product_type = 'physical';

  update carts set status = 'converted' where id = v_cart.id;

  if v_redeem_points > 0 then
    insert into loyalty_ledger (store_id, customer_id, order_id, points_delta, reason)
    values (v_store.id, v_customer_id, v_order.id, -v_redeem_points, 'order.redeemed');
  end if;

  if v_store.loyalty_enabled then
    v_earned_points := floor(v_subtotal * v_store.loyalty_earn_rate)::integer;
    if v_earned_points > 0 then
      insert into loyalty_ledger (store_id, customer_id, order_id, points_delta, reason)
      values (v_store.id, v_customer_id, v_order.id, v_earned_points, 'order.earned');
    end if;

    if v_welcome_bonus > 0 then
      insert into loyalty_ledger (store_id, customer_id, order_id, points_delta, reason)
      values (v_store.id, v_customer_id, v_order.id, v_welcome_bonus, 'referral.welcome');
    end if;

    if v_earned_points + v_welcome_bonus > 0 then
      update orders set loyalty_points_earned = v_earned_points + v_welcome_bonus where id = v_order.id;
      v_order.loyalty_points_earned := v_earned_points + v_welcome_bonus;
    end if;

    if v_referral_eligible and v_store.referral_bonus_points > 0 then
      insert into loyalty_ledger (store_id, customer_id, order_id, points_delta, reason)
      values (v_store.id, v_referrer_id, v_order.id, v_store.referral_bonus_points, 'referral.bonus');
    end if;
  end if;

  return v_order;
end;
$$;

create or replace function create_pos_order(
  p_store_id uuid,
  p_items jsonb,
  p_customer_name text default null,
  p_customer_email text default null,
  p_customer_phone text default null,
  p_payment_method text default 'cash',
  p_notes text default null
)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store stores;
  v_item jsonb;
  v_product products;
  v_quantity integer;
  v_subtotal numeric(12, 2) := 0;
  v_customer_id uuid;
  v_order orders;
begin
  if not is_store_member(p_store_id) then
    raise exception 'Accès refusé.';
  end if;

  select * into v_store from stores where id = p_store_id and is_active = true;
  if v_store.id is null then
    raise exception 'Boutique introuvable.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Aucun article dans la vente.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Quantité invalide.';
    end if;

    select * into v_product from products
    where id = (v_item ->> 'product_id')::uuid and store_id = p_store_id;

    if v_product.id is null or v_product.status <> 'active' then
      raise exception 'Un des produits sélectionnés n''est plus disponible.';
    end if;
    if v_product.product_type = 'physical' and v_product.stock < v_quantity then
      raise exception 'Stock insuffisant pour %.', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  if p_customer_email is not null and btrim(p_customer_email) <> '' then
    select id into v_customer_id
    from customers
    where organization_id = v_store.organization_id and email = p_customer_email
    limit 1;

    if v_customer_id is null then
      insert into customers (organization_id, email, full_name, phone, status)
      values (v_store.organization_id, p_customer_email, p_customer_name, p_customer_phone, 'client')
      returning id into v_customer_id;
    else
      update customers
      set full_name = coalesce(p_customer_name, full_name),
          phone = coalesce(p_customer_phone, phone),
          status = 'client'
      where id = v_customer_id;
    end if;
  end if;

  insert into orders (
    store_id, customer_id, status, payment_status, channel, payment_method,
    subtotal, total, notes
  )
  values (
    p_store_id, v_customer_id, 'delivered', 'paid', 'pos', coalesce(p_payment_method, 'cash'),
    v_subtotal, v_subtotal, p_notes
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;

    select * into v_product from products where id = (v_item ->> 'product_id')::uuid;

    insert into order_items (order_id, product_id, quantity, unit_price)
    values (v_order.id, v_product.id, v_quantity, v_product.price);

    update products set stock = stock - v_quantity
    where id = v_product.id and product_type = 'physical';
  end loop;

  return v_order;
end;
$$;

-- ============================================================
-- 5. Supabase Storage : bucket PRIVÉ pour les fichiers numériques
-- ============================================================
insert into storage.buckets (id, name, public)
values ('digital-products', 'digital-products', false)
on conflict (id) do nothing;

-- Gestion (upload/remplacement/suppression) réservée à l'équipe de la
-- boutique — chemin de stockage `${storeId}/${productId}/${fichier}`,
-- même convention que product-images.
create policy "digital_products_bucket_select_member" on storage.objects
  for select using (
    bucket_id = 'digital-products'
    and is_store_member((storage.foldername(name))[1]::uuid)
  );

create policy "digital_products_bucket_insert_member" on storage.objects
  for insert with check (
    bucket_id = 'digital-products'
    and is_store_member((storage.foldername(name))[1]::uuid)
  );

create policy "digital_products_bucket_update_member" on storage.objects
  for update using (
    bucket_id = 'digital-products'
    and is_store_member((storage.foldername(name))[1]::uuid)
  );

create policy "digital_products_bucket_delete_member" on storage.objects
  for delete using (
    bucket_id = 'digital-products'
    and is_store_member((storage.foldername(name))[1]::uuid)
  );

-- Lecture pour l'acheteur : seule policy qui permet à un client (pas
-- membre de la boutique) de générer une URL signée — createSignedUrl()
-- vérifie cette policy exactement comme un select classique.
create policy "digital_products_bucket_select_purchaser" on storage.objects
  for select using (
    bucket_id = 'digital-products'
    and customer_has_paid_digital_access(((storage.foldername(name))[2])::uuid)
  );
