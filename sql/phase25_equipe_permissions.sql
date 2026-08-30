-- BYA Flow — Phase 25 : équipe & permissions
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase23_avis_favoris.sql.

-- =========================================================
-- profiles : ajout de l'email (nécessaire pour afficher
-- l'équipe — auth.users n'est jamais lisible côté client)
-- =========================================================

alter table profiles add column if not exists email text;

update profiles
set email = auth.users.email
from auth.users
where profiles.id = auth.users.id
  and profiles.email is null;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;

-- =========================================================
-- Invitations d'équipe
-- =========================================================

create table if not exists organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists organization_invitations_pending_unique
  on organization_invitations (organization_id, email)
  where status = 'pending';

-- =========================================================
-- Fonctions
-- =========================================================

-- Permet à un membre de voir le profil (nom, email) d'un
-- coéquipier appartenant à l'une de ses organisations, sans
-- ouvrir la lecture des profils à tout le monde.
create or replace function shares_organization_with(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from organization_members m1
    join organization_members m2 on m1.organization_id = m2.organization_id
    where m1.user_id = auth.uid()
      and m2.user_id = target_user_id
  );
$$;

-- Aperçu public d'une invitation à partir de son jeton (la personne
-- invitée n'est pas encore membre de l'organisation, donc ne peut
-- pas lire organization_invitations via les policies normales).
create or replace function get_invitation_preview(p_token uuid)
returns table (
  organization_name text,
  invite_email text,
  invite_role text,
  invite_status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select o.name, oi.email, oi.role, oi.status
    from organization_invitations oi
    join organizations o on o.id = oi.organization_id
    where oi.token = p_token;
end;
$$;

-- Accepte une invitation : vérifie que l'email du compte connecté
-- correspond à l'email invité (comparaison insensible à la casse),
-- ajoute la personne à l'organisation avec le rôle prévu, marque
-- l'invitation comme acceptée. SECURITY DEFINER indispensable :
-- organization_members n'a aucune policy d'insertion directe.
create or replace function accept_organization_invitation(p_token uuid)
returns organization_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation organization_invitations;
  v_member organization_members;
begin
  select * into v_invitation
  from organization_invitations
  where organization_invitations.token = p_token
    and organization_invitations.status = 'pending';

  if v_invitation.id is null then
    raise exception 'Invitation introuvable ou déjà utilisée.';
  end if;

  if auth.email() is null or lower(auth.email()) <> lower(v_invitation.email) then
    raise exception 'Cette invitation a été envoyée à une autre adresse email. Connectez-vous avec %.', v_invitation.email;
  end if;

  if exists (
    select 1 from organization_members
    where organization_members.organization_id = v_invitation.organization_id
      and organization_members.user_id = auth.uid()
  ) then
    raise exception 'Vous faites déjà partie de cette équipe.';
  end if;

  insert into organization_members (organization_id, user_id, role)
  values (v_invitation.organization_id, auth.uid(), v_invitation.role)
  returning * into v_member;

  update organization_invitations
  set status = 'accepted', accepted_at = now()
  where organization_invitations.id = v_invitation.id;

  return v_member;
end;
$$;

-- =========================================================
-- RLS
-- =========================================================

alter table organization_invitations enable row level security;

create policy "profiles_select_org_member" on profiles
  for select using (shares_organization_with(id));

create policy "organization_invitations_select_admin" on organization_invitations
  for select using (is_org_admin(organization_id));

create policy "organization_invitations_insert_admin" on organization_invitations
  for insert with check (
    is_org_admin(organization_id)
    and invited_by = auth.uid()
    and role in ('admin', 'member')
  );

create policy "organization_invitations_delete_admin" on organization_invitations
  for delete using (is_org_admin(organization_id));

-- Un admin/owner peut changer le rôle d'un membre (jamais vers/depuis
-- 'owner' par ce chemin) ; retirer un membre est ouvert aux admins
-- ainsi qu'au membre lui-même (quitter l'équipe), sauf le propriétaire
-- (transfert de propriété non géré cette phase).
create policy "organization_members_update_admin" on organization_members
  for update using (is_org_admin(organization_id) and role <> 'owner')
  with check (is_org_admin(organization_id) and role in ('admin', 'member'));

create policy "organization_members_delete_admin_or_self" on organization_members
  for delete using (
    role <> 'owner'
    and (is_org_admin(organization_id) or user_id = auth.uid())
  );
