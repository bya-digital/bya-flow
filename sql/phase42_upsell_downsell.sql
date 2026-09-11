-- BYA Flow — Phase 42 : Upsell / Downsell
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase41_order_bump.sql.
--
-- "Ne jamais contourner le processus de paiement" (directive Section
-- 16) : contrairement à un vrai "one-click upsell" (qui rechargerait
-- une carte enregistrée sans repasser par le PSP — capacité que
-- Kkiapay/l'architecture actuelle n'offrent pas), accepter une offre
-- crée toujours une VRAIE nouvelle commande séparée, payment_status
-- 'pending' comme n'importe quelle commande, qui repasse par le même
-- vrai parcours de paiement (redirection /payer si un PSP est actif).
-- Configuré par produit déclencheur (même principe que l'Order Bump,
-- Phase 41) — les funnels de cette app n'ont pas de "checkout" propre
-- à eux pour y accrocher une config différente.

create table if not exists upsell_offers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  trigger_product_id uuid not null references products(id) on delete cascade,
  upsell_product_id uuid not null references products(id) on delete cascade,
  downsell_product_id uuid references products(id) on delete cascade,
  upsell_headline text,
  upsell_description text,
  downsell_headline text,
  downsell_description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trigger_product_id <> upsell_product_id),
  check (downsell_product_id is null or downsell_product_id <> upsell_product_id),
  check (downsell_product_id is null or downsell_product_id <> trigger_product_id)
);

drop trigger if exists set_updated_at on upsell_offers;
create trigger set_updated_at before update on upsell_offers
  for each row execute function set_updated_at();

alter table upsell_offers enable row level security;

create policy "upsell_offers_select_member" on upsell_offers
  for select using (is_store_member(store_id));
create policy "upsell_offers_insert_member" on upsell_offers
  for insert with check (is_store_member(store_id));
create policy "upsell_offers_update_member" on upsell_offers
  for update using (is_store_member(store_id));
create policy "upsell_offers_delete_member" on upsell_offers
  for delete using (is_store_member(store_id));

-- Trace de généalogie commande (offre acceptée → nouvelle commande) —
-- jamais utilisée pour contourner un paiement, uniquement pour le
-- support/l'analytics.
alter table orders add column if not exists parent_order_id uuid references orders(id) on delete set null;
alter table orders add column if not exists upsell_resolved_at timestamptz;

-- La nouvelle commande créée par accept_upsell_offer() n'a ni cart_id
-- (pas de panier) ni forcément de compte client réel (un invité n'a
-- pas de mot de passe) : ni orders_select_own_checkout ni orders_
-- select_own_account (Phases 18/19) ne la couvriraient. Troisième
-- chemin de propriété : visible si son parent_order_id pointe vers
-- une commande que l'appelant possède déjà (même session anonyme ou
-- même compte, is_order_owner() reste SECURITY DEFINER — aucun cycle
-- RLS, elle ne réévalue jamais la policy de la ligne appelante).
create policy "orders_select_own_upsell_child" on orders
  for select using (parent_order_id is not null and is_order_owner(parent_order_id));

create policy "order_items_select_own_upsell_child" on order_items
  for select using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.parent_order_id is not null
        and is_order_owner(orders.parent_order_id)
    )
  );

-- Offre à présenter pour une commande donnée (celle dont le contenu
-- déclenche une offre active, jamais résolue) — jamais un appel direct
-- sur upsell_offers depuis une page publique invitée sans vérifier
-- l'ownership de la commande.
create or replace function get_upsell_offer_for_order(p_order_id uuid)
returns table (
  offer_id uuid,
  upsell_product_id uuid,
  upsell_name text,
  upsell_price numeric,
  upsell_headline text,
  upsell_description text,
  downsell_product_id uuid,
  downsell_name text,
  downsell_price numeric,
  downsell_headline text,
  downsell_description text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    uo.id,
    up.id, up.name, up.price, uo.upsell_headline, uo.upsell_description,
    dp.id, dp.name, dp.price, uo.downsell_headline, uo.downsell_description
  from orders o
  join order_items oi on oi.order_id = o.id
  join upsell_offers uo on uo.trigger_product_id = oi.product_id and uo.store_id = o.store_id
  join products up on up.id = uo.upsell_product_id and up.status = 'active'
  left join products dp on dp.id = uo.downsell_product_id and dp.status = 'active'
  where o.id = p_order_id
    and o.upsell_resolved_at is null
    and uo.is_active = true
    and is_order_owner(o.id)
  limit 1;
$$;

-- Accepte une offre (upsell ou downsell) : crée une vraie nouvelle
-- commande séparée pour le produit concerné, toujours au prix actuel
-- en base, jamais un montant fourni par le client — jamais 'paid',
-- comme n'importe quelle commande créée ailleurs dans l'app.
create or replace function accept_upsell_offer(p_order_id uuid, p_offer_type text)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders;
  v_offer record;
  v_target_product_id uuid;
  v_target_product products;
  v_new_order orders;
begin
  if not is_order_owner(p_order_id) then
    raise exception 'Accès refusé.';
  end if;
  if p_offer_type not in ('upsell', 'downsell') then
    raise exception 'Type d''offre invalide.';
  end if;

  select * into v_order from orders where id = p_order_id;

  select * into v_offer from get_upsell_offer_for_order(p_order_id);
  if v_offer.offer_id is null then
    raise exception 'Aucune offre disponible pour cette commande.';
  end if;

  v_target_product_id := case when p_offer_type = 'upsell'
    then v_offer.upsell_product_id else v_offer.downsell_product_id end;
  if v_target_product_id is null then
    raise exception 'Aucune offre de ce type disponible.';
  end if;

  select * into v_target_product from products
  where id = v_target_product_id and status = 'active';
  if v_target_product.id is null then
    raise exception 'Produit indisponible.';
  end if;

  -- upsell_resolved_at posé dès la création (jamais null) : une
  -- commande née d'une offre acceptée n'en propose jamais une autre à
  -- son tour — évite un enchaînement A→B→A mal configuré qui
  -- ballotterait le client sans fin entre deux offres.
  insert into orders (
    store_id, customer_id, status, payment_status, shipping_address,
    subtotal, total, parent_order_id, upsell_resolved_at
  )
  values (
    v_order.store_id, v_order.customer_id, 'pending', 'pending', v_order.shipping_address,
    v_target_product.price, v_target_product.price, v_order.id, now()
  )
  returning * into v_new_order;

  insert into order_items (order_id, product_id, quantity, unit_price)
  values (v_new_order.id, v_target_product.id, 1, v_target_product.price);

  if v_target_product.product_type = 'physical' then
    update products set stock = stock - 1 where id = v_target_product.id;
  end if;

  update orders set upsell_resolved_at = now() where id = p_order_id;

  return v_new_order;
end;
$$;

-- Décline l'offre (ni upsell ni downsell accepté) — marque simplement
-- la commande comme résolue pour ne plus jamais réafficher l'offre.
create or replace function decline_upsell_offer(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_order_owner(p_order_id) then
    return false;
  end if;
  update orders set upsell_resolved_at = now() where id = p_order_id;
  return true;
end;
$$;
