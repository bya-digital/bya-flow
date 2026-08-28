-- BYA Flow — Phase 2 : authentification, multi-tenant, onboarding
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase1_base.sql.

-- =========================================================
-- Tables
-- =========================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text,
  currency text not null default 'EUR',
  country text,
  primary_goal text,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- Boutique minimale pour clore l'onboarding ; étendue en Phase 4 (personnalisation, produits...).
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  currency text not null default 'EUR',
  country text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- updated_at automatique
-- =========================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on profiles;
create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on organizations;
create trigger set_updated_at before update on organizations
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on stores;
create trigger set_updated_at before update on stores
  for each row execute function set_updated_at();

-- =========================================================
-- Création automatique du profil à l'inscription
-- =========================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =========================================================
-- Fonctions d'accès (SECURITY DEFINER pour éviter la
-- récursion RLS lors des vérifications d'appartenance)
-- =========================================================

create or replace function is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from organization_members
    where organization_members.organization_id = org_id
      and organization_members.user_id = auth.uid()
  );
$$;

create or replace function is_org_admin(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from organization_members
    where organization_members.organization_id = org_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
  );
$$;

-- Crée l'organisation et son propriétaire de façon atomique :
-- évite qu'un client authentifié doive écrire dans organization_members
-- (table sans policy d'insertion directe) en deux temps.
create or replace function create_organization_with_owner(
  p_name text,
  p_business_type text,
  p_currency text,
  p_country text,
  p_primary_goal text
)
returns organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org organizations;
begin
  insert into organizations (name, business_type, currency, country, primary_goal, owner_id)
  values (p_name, p_business_type, p_currency, p_country, p_primary_goal, auth.uid())
  returning * into v_org;

  insert into organization_members (organization_id, user_id, role)
  values (v_org.id, auth.uid(), 'owner');

  return v_org;
end;
$$;

-- =========================================================
-- RLS
-- =========================================================

alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table stores enable row level security;

create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

create policy "organizations_select_member" on organizations
  for select using (is_org_member(id));

create policy "organizations_update_admin" on organizations
  for update using (is_org_admin(id));

create policy "organization_members_select_member" on organization_members
  for select using (is_org_member(organization_id));

create policy "stores_select_member" on stores
  for select using (is_org_member(organization_id));

create policy "stores_insert_member" on stores
  for insert with check (is_org_member(organization_id));

create policy "stores_update_member" on stores
  for update using (is_org_member(organization_id));

-- Pas de policy d'insertion sur organizations / organization_members :
-- la création passe exclusivement par create_organization_with_owner()
-- (SECURITY DEFINER, propriétaire de la table => bypass RLS).
