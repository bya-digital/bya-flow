-- BYA Flow — Phase 41 : Order Bump
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase40_funnel_builder.sql.
--
-- Offre complémentaire proposée au checkout ("+ Ebook : 2 000 F") si le
-- panier contient le produit déclencheur. Le client coche l'offre, mais
-- le prix ajouté à la commande vient toujours du produit lui-même en
-- base au moment du checkout — jamais un montant envoyé par le client
-- (même discipline que checkout_cart() pour le reste du panier).

create table if not exists order_bumps (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  trigger_product_id uuid not null references products(id) on delete cascade,
  bump_product_id uuid not null references products(id) on delete cascade,
  headline text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trigger_product_id <> bump_product_id)
);

drop trigger if exists set_updated_at on order_bumps;
create trigger set_updated_at before update on order_bumps
  for each row execute function set_updated_at();

alter table order_bumps enable row level security;

create policy "order_bumps_select_member" on order_bumps
  for select using (is_store_member(store_id));
create policy "order_bumps_insert_member" on order_bumps
  for insert with check (is_store_member(store_id));
create policy "order_bumps_update_member" on order_bumps
  for update using (is_store_member(store_id));
create policy "order_bumps_delete_member" on order_bumps
  for delete using (is_store_member(store_id));

-- Lecture publique — uniquement les offres actives, même principe que
-- products_select_public (Phase 16) : un panier invité doit pouvoir
-- voir l'offre au checkout sans être membre de la boutique.
create policy "order_bumps_select_public" on order_bumps
  for select using (is_active = true);

-- checkout_cart() ré-créée : seule différence avec la version Phase 37
-- (produits numériques) — accepte désormais p_bump_product_ids, ajoute
-- chaque bump à la commande UNIQUEMENT s'il existe bien une offre
-- active pour un produit réellement présent dans le panier (jamais une
-- offre inventée ou un prix envoyé par le client).
create or replace function checkout_cart(
  p_cart_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_shipping jsonb,
  p_notes text,
  p_shipping_method_id uuid default null,
  p_redeem_points integer default 0,
  p_bump_product_ids uuid[] default null
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
  v_cart_product_ids uuid[];
  v_bump_product_id uuid;
  v_bump_product products;
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

  select array_agg(ci.product_id) into v_cart_product_ids
  from cart_items ci where ci.cart_id = v_cart.id;

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

  -- Order bump(s) : jamais ajoutés si l'offre n'est pas réellement
  -- active pour un produit réellement présent dans ce panier — le prix
  -- vient toujours de products.price en base, jamais du client.
  if p_bump_product_ids is not null then
    foreach v_bump_product_id in array p_bump_product_ids
    loop
      if exists (
        select 1 from order_bumps ob
        where ob.store_id = v_cart.store_id
          and ob.bump_product_id = v_bump_product_id
          and ob.is_active = true
          and ob.trigger_product_id = any(v_cart_product_ids)
      ) then
        select * into v_bump_product from products
        where id = v_bump_product_id and store_id = v_cart.store_id and status = 'active';

        if v_bump_product.id is not null then
          insert into order_items (order_id, product_id, quantity, unit_price)
          values (v_order.id, v_bump_product.id, 1, v_bump_product.price);

          v_subtotal := v_subtotal + v_bump_product.price;

          if v_bump_product.product_type = 'physical' then
            update products set stock = stock - 1 where id = v_bump_product.id;
          end if;
        end if;
      end if;
    end loop;

    update orders
    set subtotal = v_subtotal, total = v_subtotal - v_loyalty_discount + v_shipping_cost
    where id = v_order.id
    returning * into v_order;
  end if;

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
