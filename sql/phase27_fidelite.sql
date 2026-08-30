-- BYA Flow — Phase 27 : fidélité (points)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase26_journal_activite.sql.
--
-- Programme de points volontairement simple : X points gagnés par unité de
-- devise dépensée (sous-total, hors livraison), Y = valeur en devise d'un
-- point à la dépense. Pas de parrainage cette phase (prévu plus tard,
-- réutilisera ce même registre de points).

-- =========================================================
-- Réglages boutique
-- =========================================================

alter table stores add column if not exists loyalty_enabled boolean not null default false;
alter table stores add column if not exists loyalty_earn_rate numeric(10, 4) not null default 1;
alter table stores add column if not exists loyalty_redeem_value numeric(10, 4) not null default 0.01;

-- =========================================================
-- Registre de points
-- =========================================================

create table if not exists loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  points_delta integer not null,
  reason text not null check (reason in ('order.earned', 'order.redeemed')),
  created_at timestamptz not null default now()
);

create index if not exists loyalty_ledger_customer_idx on loyalty_ledger (store_id, customer_id);

-- Aucune policy client sur ce registre (ni select, ni écriture) : le solde
-- se lit exclusivement via get_customer_loyalty_balance() ci-dessous, et
-- l'écriture se fait exclusivement dans checkout_cart() — même principe
-- que payment_transactions / activity_logs.
alter table loyalty_ledger enable row level security;

-- Solde de points d'un client, uniquement pour le titulaire du compte
-- connecté (jamais pour un email arbitraire fourni par un panier invité) :
-- retourne 0 si l'appelant n'est pas connecté avec cet email exact, sans
-- lever d'erreur (même logique que getMyReviewEligibility côté avis).
create or replace function get_customer_loyalty_balance(p_store_id uuid, p_email text)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(loyalty_ledger.points_delta), 0)::integer
  from loyalty_ledger
  join customers on customers.id = loyalty_ledger.customer_id
  where loyalty_ledger.store_id = p_store_id
    and lower(customers.email) = lower(p_email)
    and auth.email() is not null
    and lower(auth.email()) = lower(p_email);
$$;

-- =========================================================
-- checkout_cart() étendue : gain de points à la commande, et
-- utilisation optionnelle de points existants en réduction.
-- =========================================================

alter table orders add column if not exists loyalty_points_earned integer not null default 0;
alter table orders add column if not exists loyalty_points_redeemed integer not null default 0;
alter table orders add column if not exists loyalty_discount numeric(12, 2) not null default 0;

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

  -- Utilisation de points : seulement pour le titulaire du compte connecté
  -- (jamais pour un panier invité qui aurait simplement tapé cet email),
  -- et seulement si le programme est actif. Le nombre de points est
  -- systématiquement recalculé/plafonné ici, jamais fait confiance au
  -- client : plafonné au solde réel et à la valeur du sous-total.
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

      update orders set loyalty_points_earned = v_earned_points where id = v_order.id;
      v_order.loyalty_points_earned := v_earned_points;
    end if;
  end if;

  return v_order;
end;
$$;
