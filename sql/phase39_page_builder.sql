-- BYA Flow — Phase 39 : Page Builder (pages de vente sans code)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase38_formations.sql.
--
-- Une page = une seule colonne jsonb (blocks), pas une table par type
-- de bloc — chaque bloc est {id, type, props}, le type déterminant la
-- forme de props côté application (lib/pageBuilder/types.ts). Permet
-- d'ajouter de nouveaux types de blocs plus tard sans migration.

create table if not exists store_pages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  title text not null,
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

drop trigger if exists set_updated_at on store_pages;
create trigger set_updated_at before update on store_pages
  for each row execute function set_updated_at();

alter table store_pages enable row level security;

create policy "store_pages_select_member" on store_pages
  for select using (is_store_member(store_id));
create policy "store_pages_insert_member" on store_pages
  for insert with check (is_store_member(store_id));
create policy "store_pages_update_member" on store_pages
  for update using (is_store_member(store_id));
create policy "store_pages_delete_member" on store_pages
  for delete using (is_store_member(store_id));

-- Lecture publique — uniquement les pages publiées, même principe que
-- products_select_public (Phase 16).
create policy "store_pages_select_public" on store_pages
  for select using (status = 'published');

-- ============================================================
-- Capture de leads (bloc "formulaire") — jamais une policy insert
-- ouverte directement sur la table : une fonction SECURITY DEFINER
-- vérifie elle-même que la page existe et est publiée avant d'écrire,
-- même principe que checkout_cart().
-- ============================================================
create table if not exists page_leads (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references store_pages(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table page_leads enable row level security;

create policy "page_leads_select_member" on page_leads
  for select using (is_store_member(store_id));
-- Aucune policy insert : uniquement via capture_page_lead().

create or replace function capture_page_lead(p_page_id uuid, p_email text, p_full_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
begin
  if p_email is null or btrim(p_email) = '' then
    return false;
  end if;

  select store_id into v_store_id
  from store_pages
  where id = p_page_id and status = 'published';

  if v_store_id is null then
    return false;
  end if;

  insert into page_leads (page_id, store_id, email, full_name)
  values (p_page_id, v_store_id, btrim(p_email), nullif(btrim(coalesce(p_full_name, '')), ''));

  return true;
end;
$$;
