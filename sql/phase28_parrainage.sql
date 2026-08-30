-- BYA Flow — Phase 28 : parrainage
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase27_fidelite.sql.
--
-- Réutilise le registre de points posé en Phase 27 plutôt que d'inventer un
-- second système de récompense. Pas de code de parrainage stocké : dérivé
-- de l'id client (8 caractères hex d'un md5 sur un uuid déjà unique), donc
-- aucune gestion de collision à écrire.

-- =========================================================
-- Réglages boutique
-- =========================================================

alter table stores add column if not exists referral_enabled boolean not null default false;
alter table stores add column if not exists referral_bonus_points integer not null default 0;
alter table stores add column if not exists referral_welcome_points integer not null default 0;

-- =========================================================
-- Attribution : capturée à la création du panier (cookie posé par le
-- middleware quand le visiteur arrive avec ?ref=CODE côté application),
-- jamais un paramètre fourni par le client au moment du paiement — même
-- principe de défiance que l'utilisation des points en Phase 27.
-- =========================================================

alter table carts add column if not exists referred_by_customer_id uuid references customers(id) on delete set null;

alter table loyalty_ledger drop constraint if exists loyalty_ledger_reason_check;
alter table loyalty_ledger add constraint loyalty_ledger_reason_check
  check (reason in ('order.earned', 'order.redeemed', 'referral.bonus', 'referral.welcome'));

-- =========================================================
-- Fonctions
-- =========================================================

-- Code de parrainage du client connecté pour cette boutique ; crée sa
-- fiche client (statut 'prospect') si elle n'existe pas encore — un
-- client peut vouloir partager son lien avant tout premier achat.
create or replace function get_my_referral_code(p_store_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_customer_id uuid;
begin
  if auth.email() is null then
    return null;
  end if;

  select organization_id into v_org_id from stores where id = p_store_id and is_active = true;
  if v_org_id is null then
    return null;
  end if;

  select id into v_customer_id
  from customers
  where organization_id = v_org_id and lower(email) = lower(auth.email())
  limit 1;

  if v_customer_id is null then
    insert into customers (organization_id, email, status)
    values (v_org_id, auth.email(), 'prospect')
    returning id into v_customer_id;
  end if;

  return upper(substr(md5(v_customer_id::text), 1, 8));
end;
$$;

-- Retrouve le client correspondant à un code, pour un visiteur anonyme
-- qui arrive avec ?ref=CODE (donc avant tout compte/panier).
create or replace function resolve_referral_code(p_store_id uuid, p_code text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select customers.id
  from customers
  join stores on stores.organization_id = customers.organization_id
  where stores.id = p_store_id
    and upper(substr(md5(customers.id::text), 1, 8)) = upper(btrim(p_code))
  limit 1;
$$;

-- =========================================================
-- checkout_cart() étendue : bonus de parrainage au premier achat
-- d'un client parrainé (jamais à l'auto-parrainage, jamais au-delà
-- du premier achat).
-- =========================================================

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

  -- Parrainage : uniquement pour un vrai premier achat, jamais pour
  -- soi-même. L'identité du parrain vient du panier (posée côté
  -- serveur à la visite du lien ?ref=, jamais d'un champ du formulaire
  -- de paiement) — un panier invité ne peut donc pas la falsifier.
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
  where ci.cart_id = v_cart.id and p.id = ci.product_id;

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
