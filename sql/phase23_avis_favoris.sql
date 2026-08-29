-- BYA Flow — Phase 23 : avis clients & favoris
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase22_store_builder.sql.
--
-- Règle métier : un client ne peut laisser un avis que sur un produit
-- qu'il a réellement acheté (au moins une commande non annulée contenant
-- ce produit, sous le même email). Cette vérification touche plusieurs
-- tables (order_items, orders, customers) qu'un client authentifié ne
-- peut pas toutes lire directement — passe donc par une fonction
-- SECURITY DEFINER, même principe que checkout_cart() en Phase 18.
--
-- Les favoris exigent un vrai compte client (pas de panier anonyme
-- fusionné comme pour le panier — un visiteur non connecté doit se
-- connecter pour ajouter un favori, ce qui reste honnête plutôt que de
-- construire une fusion supplémentaire sans besoin prouvé).

create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_email text not null,
  customer_name text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  merchant_reply text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, customer_email)
);

drop trigger if exists set_updated_at on product_reviews;
create trigger set_updated_at before update on product_reviews
  for each row execute function set_updated_at();

alter table product_reviews enable row level security;

-- Lecture publique : uniquement les avis visibles d'un produit lui-même
-- publiquement visible (même fonction que product_images/product_variants
-- en Phase 16).
create policy "product_reviews_select_public" on product_reviews
  for select using (is_visible = true and is_product_public(product_id));

-- Lecture/écriture marchand : modération (is_visible) et réponse
-- (merchant_reply), jamais la note ni le commentaire du client.
create policy "product_reviews_select_member" on product_reviews
  for select using (is_product_member(product_id));
create policy "product_reviews_update_member" on product_reviews
  for update using (is_product_member(product_id));

-- Pas de policy d'insertion directe : uniquement via submit_review().
create or replace function submit_review(
  p_product_id uuid,
  p_rating integer,
  p_comment text
)
returns product_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.email();
  v_name text;
  v_has_purchased boolean;
  v_review product_reviews;
begin
  if v_email is null then
    raise exception 'Connexion requise pour laisser un avis.';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'Note invalide.';
  end if;

  select exists (
    select 1
    from order_items oi
    join orders o on o.id = oi.order_id
    join customers c on c.id = o.customer_id
    where oi.product_id = p_product_id
      and c.email = v_email
      and o.status <> 'cancelled'
  ) into v_has_purchased;

  if not v_has_purchased then
    raise exception 'Seuls les clients ayant acheté ce produit peuvent laisser un avis.';
  end if;

  select full_name into v_name
  from customers where email = v_email order by created_at desc limit 1;

  insert into product_reviews (product_id, customer_email, customer_name, rating, comment)
  values (p_product_id, v_email, v_name, p_rating, p_comment)
  on conflict (product_id, customer_email)
  do update set rating = excluded.rating, comment = excluded.comment, updated_at = now()
  returning * into v_review;

  return v_review;
end;
$$;

create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  customer_email text not null,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (store_id, customer_email, product_id)
);

alter table wishlist_items enable row level security;

create policy "wishlist_items_select_own" on wishlist_items
  for select using (customer_email = auth.email());
create policy "wishlist_items_insert_own" on wishlist_items
  for insert with check (customer_email = auth.email());
create policy "wishlist_items_delete_own" on wishlist_items
  for delete using (customer_email = auth.email());
