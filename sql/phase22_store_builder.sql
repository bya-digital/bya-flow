-- BYA Flow — Phase 22 : Store Builder (personnalisation de la boutique publique)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase21_paiements.sql.
--
-- Architecture volontairement simple : un jeu de champs fixes sur
-- "stores" (hero, couleur d'accent, réseaux sociaux, footer) plutôt
-- qu'un système de sections/blocs entièrement libre — évite de
-- construire un page builder complexe sans utilité prouvée, tout en
-- couvrant les besoins réels de personnalisation d'une vitrine.
-- Témoignages et FAQ restent des listes dynamiques (tables séparées),
-- comme les méthodes de livraison ou les coupons.

alter table stores add column if not exists hero_title text;
alter table stores add column if not exists hero_subtitle text;
alter table stores add column if not exists hero_image_url text;
alter table stores add column if not exists hero_cta_label text;
alter table stores add column if not exists accent_color text;
alter table stores add column if not exists social_facebook text;
alter table stores add column if not exists social_instagram text;
alter table stores add column if not exists social_tiktok text;
alter table stores add column if not exists social_whatsapp text;
alter table stores add column if not exists footer_text text;

create table if not exists store_testimonials (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  author_name text not null,
  quote text not null,
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists store_faqs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  question text not null,
  answer text not null,
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table store_testimonials enable row level security;
alter table store_faqs enable row level security;

create policy "store_testimonials_select_member" on store_testimonials
  for select using (is_store_member(store_id));
create policy "store_testimonials_insert_member" on store_testimonials
  for insert with check (is_store_member(store_id));
create policy "store_testimonials_update_member" on store_testimonials
  for update using (is_store_member(store_id));
create policy "store_testimonials_delete_member" on store_testimonials
  for delete using (is_store_member(store_id));

create policy "store_faqs_select_member" on store_faqs
  for select using (is_store_member(store_id));
create policy "store_faqs_insert_member" on store_faqs
  for insert with check (is_store_member(store_id));
create policy "store_faqs_update_member" on store_faqs
  for update using (is_store_member(store_id));
create policy "store_faqs_delete_member" on store_faqs
  for delete using (is_store_member(store_id));

-- Lecture anonyme (même principe que products_select_public en Phase 16) :
-- uniquement pour une boutique publiée, et seulement les entrées actives.
create policy "store_testimonials_select_public" on store_testimonials
  for select using (
    is_active = true
    and exists (select 1 from stores where stores.id = store_testimonials.store_id and stores.is_active = true)
  );

create policy "store_faqs_select_public" on store_faqs
  for select using (
    is_active = true
    and exists (select 1 from stores where stores.id = store_faqs.store_id and stores.is_active = true)
  );
