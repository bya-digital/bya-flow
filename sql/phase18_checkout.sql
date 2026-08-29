-- BYA Flow — Phase 18 : checkout invité (panier → commande)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase17_panier.sql.
--
-- Contexte : transformer un panier anonyme en vraie commande implique
-- plusieurs écritures liées (client CRM, commande, lignes de commande,
-- décrément de stock, panier marqué "converti") qui doivent réussir ou
-- échouer ensemble. Plutôt que d'ouvrir des policies RLS d'écriture
-- anonymes sur 4 tables différentes (fragile, difficile à garder
-- cohérent), tout passe par une seule fonction SECURITY DEFINER — même
-- principe que create_organization_with_owner() en Phase 2 : la fonction
-- vérifie elle-même que l'appelant possède bien le panier (anon_user_id
-- = auth.uid()) avant d'écrire quoi que ce soit.
--
-- Le paiement n'est PAS traité ici (Phase 11, pas encore construite) :
-- la commande est créée avec payment_status = 'pending', jamais 'paid'.

alter table orders add column if not exists cart_id uuid references carts(id) on delete set null;

create index if not exists customers_org_email_idx on customers (organization_id, email);

create or replace function checkout_cart(
  p_cart_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_shipping jsonb,
  p_notes text
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
  v_total numeric(12, 2) := 0;
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

  -- Revalide le stock au moment du checkout (il a pu changer depuis
  -- l'ajout au panier) et recalcule le total à partir des prix figés
  -- dans le panier, jamais depuis le prix courant du produit.
  for v_item in
    select ci.product_id, ci.quantity, ci.unit_price, p.stock, p.status as product_status
    from cart_items ci
    join products p on p.id = ci.product_id
    where ci.cart_id = v_cart.id
  loop
    if v_item.product_status <> 'active' or v_item.stock < v_item.quantity then
      raise exception 'Stock insuffisant pour un des produits du panier.';
    end if;
    v_total := v_total + (v_item.unit_price * v_item.quantity);
  end loop;

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

  insert into orders (store_id, customer_id, cart_id, status, payment_status, shipping_address, notes, total)
  values (v_cart.store_id, v_customer_id, v_cart.id, 'pending', 'pending', p_shipping, p_notes, v_total)
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

-- Lecture de la commande de confirmation par le client qui vient de la
-- passer (scoping via le panier dont elle est issue, pas via un compte
-- client — celui-ci arrive en Phase 9).

create or replace function is_order_owner_anon(p_order_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from orders
    join carts on carts.id = orders.cart_id
    where orders.id = p_order_id
      and carts.anon_user_id = auth.uid()
  );
$$;

create policy "orders_select_own_checkout" on orders
  for select using (
    cart_id is not null
    and exists (select 1 from carts where carts.id = orders.cart_id and carts.anon_user_id = auth.uid())
  );

create policy "order_items_select_own_checkout" on order_items
  for select using (is_order_owner_anon(order_id));
