-- BYA Flow — Phase 19 : compte client
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase18_checkout.sql.
--
-- Contexte : un client peut désormais créer un vrai compte (email/mot de
-- passe, même mécanisme que les comptes marchands) pour retrouver son
-- historique de commandes. Pas de nouvelle colonne : on identifie "ses"
-- données via auth.email(), en comparant avec customers.email — la même
-- adresse qui sert déjà à retrouver/créer le client au moment du
-- checkout invité (phase18). Un visiteur anonyme n'a pas d'email
-- (auth.email() renvoie NULL), donc ces policies ne lui donnent
-- naturellement aucun accès supplémentaire.

create policy "customers_select_own_account" on customers
  for select using (email = auth.email());

create or replace function is_order_owner_account(p_order_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from orders
    join customers on customers.id = orders.customer_id
    where orders.id = p_order_id
      and customers.email = auth.email()
  );
$$;

create policy "orders_select_own_account" on orders
  for select using (
    customer_id is not null
    and exists (
      select 1 from customers
      where customers.id = orders.customer_id and customers.email = auth.email()
    )
  );

create policy "order_items_select_own_account" on order_items
  for select using (is_order_owner_account(order_id));

-- Fusion panier invité → panier du compte, appelée juste après une
-- connexion réussie : se connecter change auth.uid() (le panier anonyme
-- d'avant connexion, lié à l'ancien auth.uid(), deviendrait sinon
-- inaccessible). Le panier précédent est fourni par le serveur lui-même
-- (lu avant l'appel de connexion, donc légitimement à ce visiteur) :
-- pas de policy RLS supplémentaire nécessaire, la fonction est
-- SECURITY DEFINER et ne fait que déplacer des lignes déjà propres à
-- cette boutique.
create or replace function merge_cart(p_store_id uuid, p_previous_cart_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_cart_id uuid;
  v_prev_store_id uuid;
  v_item record;
  v_existing_id uuid;
  v_existing_qty integer;
begin
  if p_previous_cart_id is null then
    return;
  end if;

  select store_id into v_prev_store_id from carts
  where id = p_previous_cart_id and status = 'active';

  if v_prev_store_id is null or v_prev_store_id <> p_store_id then
    return;
  end if;

  select id into v_target_cart_id
  from carts
  where store_id = p_store_id and anon_user_id = auth.uid() and status = 'active';

  if v_target_cart_id is null then
    -- Le compte n'avait pas encore de panier actif ici : le panier
    -- précédent devient simplement le sien.
    update carts set anon_user_id = auth.uid() where id = p_previous_cart_id;
    return;
  end if;

  if v_target_cart_id = p_previous_cart_id then
    return;
  end if;

  for v_item in
    select id, product_id, quantity from cart_items where cart_id = p_previous_cart_id
  loop
    select id, quantity into v_existing_id, v_existing_qty
    from cart_items where cart_id = v_target_cart_id and product_id = v_item.product_id;

    if v_existing_id is null then
      update cart_items set cart_id = v_target_cart_id where id = v_item.id;
    else
      update cart_items set quantity = v_existing_qty + v_item.quantity where id = v_existing_id;
      delete from cart_items where id = v_item.id;
    end if;
  end loop;

  update carts set status = 'abandoned' where id = p_previous_cart_id;
end;
$$;
