-- BYA Flow — Phase 26 : journal d'activité (équipe)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase25_equipe_permissions.sql.
--
-- Première tranche du journal d'activité : les actions sur l'équipe
-- (invitations, rôles, retraits). Les autres modules (commandes,
-- paiements, produits...) ne sont pas couverts par cette phase —
-- extension prévue plus tard, phase par phase.

-- =========================================================
-- Table
-- =========================================================

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text,
  action text not null,
  target_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_org_created_idx
  on activity_logs (organization_id, created_at desc);

-- =========================================================
-- Fonctions
-- =========================================================

create or replace function current_actor_label()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(profiles.full_name, profiles.email, auth.uid()::text)
  from profiles
  where profiles.id = auth.uid();
$$;

-- Écrit automatiquement dans le journal à chaque création,
-- acceptation ou annulation d'invitation. SECURITY DEFINER : le
-- journal n'a aucune policy d'insertion directe, on ne peut pas
-- l'écrire depuis le client, seulement via ces déclencheurs.
create or replace function log_invitation_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into activity_logs (organization_id, actor_user_id, actor_name, action, target_label, metadata)
    values (
      NEW.organization_id, auth.uid(), current_actor_label(),
      'invitation.created', NEW.email, jsonb_build_object('role', NEW.role)
    );
  elsif TG_OP = 'UPDATE' and NEW.status = 'accepted' and OLD.status = 'pending' then
    insert into activity_logs (organization_id, actor_user_id, actor_name, action, target_label, metadata)
    values (
      NEW.organization_id, auth.uid(), current_actor_label(),
      'invitation.accepted', NEW.email, jsonb_build_object('role', NEW.role)
    );
  elsif TG_OP = 'DELETE' and OLD.status = 'pending' then
    insert into activity_logs (organization_id, actor_user_id, actor_name, action, target_label, metadata)
    values (
      OLD.organization_id, auth.uid(), current_actor_label(),
      'invitation.revoked', OLD.email, jsonb_build_object('role', OLD.role)
    );
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_log_invitation_activity_ins on organization_invitations;
create trigger trg_log_invitation_activity_ins
  after insert on organization_invitations
  for each row execute function log_invitation_activity();

drop trigger if exists trg_log_invitation_activity_upd on organization_invitations;
create trigger trg_log_invitation_activity_upd
  after update on organization_invitations
  for each row execute function log_invitation_activity();

drop trigger if exists trg_log_invitation_activity_del on organization_invitations;
create trigger trg_log_invitation_activity_del
  after delete on organization_invitations
  for each row execute function log_invitation_activity();

-- Écrit automatiquement dans le journal à chaque changement de rôle
-- ou retrait de membre (la création du premier membre — le
-- propriétaire, via create_organization_with_owner — n'est pas
-- journalisée : ce n'est pas une action à auditer).
create or replace function log_member_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_label text;
begin
  if TG_OP = 'UPDATE' and NEW.role is distinct from OLD.role then
    select coalesce(profiles.full_name, profiles.email, NEW.user_id::text) into v_target_label
    from profiles where profiles.id = NEW.user_id;

    insert into activity_logs (organization_id, actor_user_id, actor_name, action, target_label, metadata)
    values (
      NEW.organization_id, auth.uid(), current_actor_label(),
      'member.role_updated', v_target_label,
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
    );
  elsif TG_OP = 'DELETE' then
    select coalesce(profiles.full_name, profiles.email, OLD.user_id::text) into v_target_label
    from profiles where profiles.id = OLD.user_id;

    insert into activity_logs (organization_id, actor_user_id, actor_name, action, target_label, metadata)
    values (
      OLD.organization_id, auth.uid(), current_actor_label(),
      'member.removed', v_target_label, jsonb_build_object('role', OLD.role)
    );
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_log_member_activity_upd on organization_members;
create trigger trg_log_member_activity_upd
  after update on organization_members
  for each row execute function log_member_activity();

drop trigger if exists trg_log_member_activity_del on organization_members;
create trigger trg_log_member_activity_del
  after delete on organization_members
  for each row execute function log_member_activity();

-- =========================================================
-- RLS
-- =========================================================

alter table activity_logs enable row level security;

create policy "activity_logs_select_admin" on activity_logs
  for select using (is_org_admin(organization_id));
