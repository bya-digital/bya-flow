-- BYA Flow — Phase 33 : point de vente (caisse)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase31_api_webhooks.sql
-- (la Phase 32, multi-boutiques, n'avait pas de SQL).
--
-- Vente en personne (boutique physique, marché, salon) sur le même
-- catalogue/stock que la boutique en ligne. Le paiement n'est jamais
-- simulé : contrairement au checkout en ligne (où payment_status reste
-- 'pending' faute de vrai prestataire), ici c'est le vendeur qui
-- constate lui-même, en personne, qu'il vient de recevoir le paiement
-- (espèces ou carte via son propre terminal) — exactement comme une
-- caisse enregistreuse classique, ce n'est pas l'app qui invente un
-- résultat de paiement.

alter table orders add column if not exists channel text not null default 'online'
  check (channel in ('online', 'pos'));
alter table orders add column if not exists payment_method text
  check (payment_method is null or payment_method in ('cash', 'card', 'other'));

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

  -- Revalide systématiquement le stock et le prix courant du produit
  -- ici, jamais un montant envoyé par le client — même principe que
  -- checkout_cart().
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
    if v_product.stock < v_quantity then
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

    update products set stock = stock - v_quantity where id = v_product.id;
  end loop;

  return v_order;
end;
$$;
