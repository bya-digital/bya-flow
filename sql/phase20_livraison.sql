-- BYA Flow — Phase 20 : livraison
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase19_compte_client.sql.
--
-- Architecture volontairement simple pour cette phase : des méthodes de
-- livraison à plat (nom, prix, seuil de gratuité optionnel), pas encore
-- de zones géographiques ni de transporteurs — l'architecture (table
-- séparée, référencée par id depuis les commandes) reste extensible sans
-- migration de rattrapage le jour où c'est nécessaire.

create table if not exists shipping_methods (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12, 2) not null default 0,
  free_above numeric(12, 2),
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on shipping_methods;
create trigger set_updated_at before update on shipping_methods
  for each row execute function set_updated_at();

alter table shipping_methods enable row level security;

create policy "shipping_methods_select_member" on shipping_methods
  for select using (is_store_member(store_id));
create policy "shipping_methods_insert_member" on shipping_methods
  for insert with check (is_store_member(store_id));
create policy "shipping_methods_update_member" on shipping_methods
  for update using (is_store_member(store_id));
create policy "shipping_methods_delete_member" on shipping_methods
  for delete using (is_store_member(store_id));

-- Lecture anonyme des méthodes actives d'une boutique publiée (même
-- principe que products_select_public en Phase 16).
create policy "shipping_methods_select_public" on shipping_methods
  for select using (
    is_active = true
    and exists (select 1 from stores where stores.id = shipping_methods.store_id and stores.is_active = true)
  );

-- Prix figé sur la commande au moment du checkout (shipping_method_name/
-- shipping_cost), même logique que unit_price sur order_items : si le
-- commerçant modifie ou supprime la méthode ensuite, les commandes
-- passées ne changent pas rétroactivement.
alter table orders add column if not exists shipping_method_id uuid references shipping_methods(id) on delete set null;
alter table orders add column if not exists shipping_method_name text;
alter table orders add column if not exists shipping_cost numeric(12, 2) not null default 0;
alter table orders add column if not exists subtotal numeric(12, 2) not null default 0;

-- checkout_cart() étendue : accepte une méthode de livraison optionnelle
-- (p_shipping_method_id peut être NULL si la boutique n'en a configuré
-- aucune, pour rester compatible) et calcule le coût réel — jamais fait
-- confiance à un montant envoyé par le client.
create or replace function checkout_cart(
  p_cart_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_shipping jsonb,
  p_notes text,
  p_shipping_method_id uuid default null
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
    select ci.product_id, ci.quantity, ci.unit_price, p.stock, p.status as product_status
    from cart_items ci
    join products p on p.id = ci.product_id
    where ci.cart_id = v_cart.id
  loop
    if v_item.product_status <> 'active' or v_item.stock < v_item.quantity then
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

  insert into orders (
    store_id, customer_id, cart_id, status, payment_status, shipping_address, notes,
    subtotal, shipping_method_id, shipping_method_name, shipping_cost, total
  )
  values (
    v_cart.store_id, v_customer_id, v_cart.id, 'pending', 'pending', p_shipping, p_notes,
    v_subtotal, p_shipping_method_id, v_shipping_name, v_shipping_cost, v_subtotal + v_shipping_cost
  )
  returning * into v_order;

  insert into order_items (order_id, product_id, quantity, unit_price)
  select v_order.id, ci.product_id, ci.quantity, ci.unit_price
  from cart_items ci
  where ci.cart_id = v_cart.id;

  update products p
  set stock = p.stock - ci.quantity
  from cart_items ci
  where ci.cart_id = v_cart.id and p.id = ci.product_id;

  update carts set status = 'converted' where id = v_cart.id;

  return v_order;
end;
$$;
