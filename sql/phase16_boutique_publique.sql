-- BYA Flow — Phase 16 : boutique publique (lecture anonyme)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase15_admin_plateforme.sql.
--
-- Contexte : jusqu'ici, toute lecture Supabase passait par un membre
-- authentifié d'une organisation (RLS scoping par organization_id/store_id).
-- La boutique publique doit être lisible par un visiteur anonyme — ces
-- nouvelles policies s'ajoutent aux policies existantes (une ligne est
-- visible dès qu'AU MOINS une policy l'autorise) et n'exposent que ce
-- qu'un commerçant a explicitement publié :
--   - une boutique désactivée (is_active = false) reste invisible ;
--   - un produit en brouillon ou archivé (status != 'active') reste
--     invisible, même si sa boutique est publiée.
-- Aucune donnée sensible (organisation, clients, commandes) n'est
-- concernée par cette phase.

-- Bug trouvé pendant cette phase : l'onboarding (lib/actions/onboarding.ts)
-- insère une boutique sans jamais renseigner "slug" — seul le rattrapage
-- ponctuel de la Phase 4 avait donné un slug aux boutiques existant à ce
-- moment-là. Toute boutique créée depuis a donc un slug NULL, ce qui rend
-- /store/ inutilisable. Corrigé ici par un trigger (protège aussi tout
-- futur point d'insertion, pas seulement l'onboarding) + un rattrapage
-- pour les boutiques déjà créées sans slug.

create or replace function set_store_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := lower(regexp_replace(new.name, '[^a-zA-Z0-9]+', '-', 'g'))
      || '-' || substr(new.id::text, 1, 8);
  end if;
  return new;
end;
$$;

drop trigger if exists set_store_slug on stores;
create trigger set_store_slug before insert on stores
  for each row execute function set_store_slug();

update stores
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 8)
where slug is null or btrim(slug) = '';

alter table stores alter column slug set not null;

create or replace function is_product_public(p_product_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from products
    join stores on stores.id = products.store_id
    where products.id = p_product_id
      and products.status = 'active'
      and stores.is_active = true
  );
$$;

create policy "stores_select_public" on stores
  for select using (is_active = true);

create policy "products_select_public" on products
  for select using (
    status = 'active'
    and exists (
      select 1 from stores
      where stores.id = products.store_id and stores.is_active = true
    )
  );

create policy "product_categories_select_public" on product_categories
  for select using (
    exists (
      select 1 from stores
      where stores.id = product_categories.store_id and stores.is_active = true
    )
  );

create policy "product_images_select_public" on product_images
  for select using (is_product_public(product_id));

create policy "product_variants_select_public" on product_variants
  for select using (is_product_public(product_id));
