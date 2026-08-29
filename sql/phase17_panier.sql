-- BYA Flow — Phase 17 : panier (visiteur anonyme)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase16_boutique_publique.sql.
--
-- Contexte : un visiteur de la boutique publique n'a pas de compte (la
-- création de compte client arrive plus tard, Phase 9). Pour qu'il
-- retrouve son panier d'une page à l'autre sans compte, on utilise
-- l'authentification anonyme de Supabase : le middleware ouvre une
-- session anonyme dès qu'un visiteur arrive sur /store/*, ce qui donne
-- un vrai auth.uid() stable (cookie de session), sans créer de fiche
-- client CRM ni exposer la moindre donnée d'une autre boutique.
--
-- ⚠️ Avant d'exécuter ce fichier : dans le dashboard Supabase, aller dans
-- Authentication → Settings → activer "Allow anonymous sign-ins". Sans
-- ça, la création de session anonyme échoue silencieusement et le panier
-- ne fonctionnera pas.

alter table carts add column if not exists anon_user_id uuid references auth.users(id) on delete cascade;

-- Un seul panier actif par visiteur anonyme et par boutique.
create unique index if not exists carts_store_anon_active_key
  on carts (store_id, anon_user_id)
  where status = 'active' and anon_user_id is not null;

create or replace function is_cart_owner_anon(p_cart_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from carts
    where carts.id = p_cart_id
      and carts.anon_user_id = auth.uid()
  );
$$;

create policy "carts_select_anon_own" on carts
  for select using (anon_user_id = auth.uid());

create policy "carts_insert_anon_own" on carts
  for insert with check (anon_user_id = auth.uid());

create policy "cart_items_select_anon_own" on cart_items
  for select using (is_cart_owner_anon(cart_id));

create policy "cart_items_insert_anon_own" on cart_items
  for insert with check (is_cart_owner_anon(cart_id));

create policy "cart_items_update_anon_own" on cart_items
  for update using (is_cart_owner_anon(cart_id));

create policy "cart_items_delete_anon_own" on cart_items
  for delete using (is_cart_owner_anon(cart_id));
