-- BYA Flow — Phase 40 : Funnel Builder
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase39_page_builder.sql.
--
-- Un funnel n'est jamais un nouveau système de contenu : c'est un
-- ordre nommé sur des pages (Page Builder, Phase 39) et des produits
-- déjà existants — LANDING/CAPTURE/VENTE sont des pages, CHECKOUT est
-- la fiche produit existante (le client clique "Ajouter au panier"
-- lui-même, aucun nouveau chemin de paiement créé), THANK YOU est déjà
-- la page de confirmation de commande existante. Seul ajout réel :
-- le suivi de visites par étape.

create table if not exists funnels (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on funnels;
create trigger set_updated_at before update on funnels
  for each row execute function set_updated_at();

create table if not exists funnel_steps (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references funnels(id) on delete cascade,
  position integer not null default 0,
  step_type text not null check (step_type in ('page', 'product')),
  page_id uuid references store_pages(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  label text,
  created_at timestamptz not null default now(),
  check (
    (step_type = 'page' and page_id is not null and product_id is null)
    or (step_type = 'product' and product_id is not null and page_id is null)
  )
);

-- Visite unique par visiteur (déjà une session anonyme Supabase pour
-- tout visiteur boutique, posée par middleware.ts) — dédoublonnée pour
-- que la statistique compte des visiteurs, pas des pages vues.
create table if not exists funnel_step_visits (
  id uuid primary key default gen_random_uuid(),
  funnel_step_id uuid not null references funnel_steps(id) on delete cascade,
  visitor_key uuid not null,
  visited_at timestamptz not null default now(),
  unique (funnel_step_id, visitor_key)
);

create or replace function is_funnel_member(p_funnel_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from funnels
    where funnels.id = p_funnel_id and is_store_member(funnels.store_id)
  );
$$;

alter table funnels enable row level security;
alter table funnel_steps enable row level security;
alter table funnel_step_visits enable row level security;

create policy "funnels_select_member" on funnels
  for select using (is_store_member(store_id));
create policy "funnels_insert_member" on funnels
  for insert with check (is_store_member(store_id));
create policy "funnels_update_member" on funnels
  for update using (is_store_member(store_id));
create policy "funnels_delete_member" on funnels
  for delete using (is_store_member(store_id));

create policy "funnel_steps_select_member" on funnel_steps
  for select using (is_funnel_member(funnel_id));
create policy "funnel_steps_insert_member" on funnel_steps
  for insert with check (is_funnel_member(funnel_id));
create policy "funnel_steps_update_member" on funnel_steps
  for update using (is_funnel_member(funnel_id));
create policy "funnel_steps_delete_member" on funnel_steps
  for delete using (is_funnel_member(funnel_id));

create policy "funnel_step_visits_select_member" on funnel_step_visits
  for select using (
    exists (
      select 1 from funnel_steps
      where funnel_steps.id = funnel_step_visits.funnel_step_id
        and is_funnel_member(funnel_steps.funnel_id)
    )
  );
-- Aucune policy insert : uniquement via record_funnel_step_visit().

-- Appelée depuis les pages publiques (page de vente ou fiche produit)
-- au moment de l'affichage — journalise la visite pour chaque étape de
-- funnel qui référence cette page/ce produit (généralement une seule,
-- une page pouvant réutiliser un même contenu dans plusieurs funnels
-- n'est pas empêchée). auth.uid() existe toujours ici : middleware.ts
-- attribue une session anonyme à tout visiteur de /store/*.
create or replace function record_funnel_step_visit(p_page_id uuid default null, p_product_id uuid default null)
returns void
language sql
security definer
set search_path = public
as $$
  insert into funnel_step_visits (funnel_step_id, visitor_key)
  select fs.id, auth.uid()
  from funnel_steps fs
  where auth.uid() is not null
    and (
      (p_page_id is not null and fs.page_id = p_page_id)
      or (p_product_id is not null and fs.product_id = p_product_id)
    )
  on conflict (funnel_step_id, visitor_key) do nothing;
$$;

-- Visites uniques par étape, pour l'affichage des statistiques —
-- jamais un select brut sur funnel_step_visits depuis l'app (RLS déjà
-- suffisante ici, mais cette agrégation évite de retélécharger chaque
-- ligne pour ne garder qu'un compte).
create or replace function get_funnel_step_stats(p_funnel_id uuid)
returns table (funnel_step_id uuid, visit_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select fs.id, count(fsv.id)
  from funnel_steps fs
  left join funnel_step_visits fsv on fsv.funnel_step_id = fs.id
  where fs.funnel_id = p_funnel_id and is_funnel_member(p_funnel_id)
  group by fs.id;
$$;
