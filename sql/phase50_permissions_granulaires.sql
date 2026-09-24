-- BYA Flow — Phase 50 : Permissions granulaires
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase48_recommandations.sql.
--
-- Aujourd'hui, un membre simple ('member') a un accès complet à
-- toutes les données métier de l'organisation (produits, commandes,
-- clients, marketing, finances, réglages boutique) — seule la petite
-- surface admin (équipe, clés API, journal d'audit, secrets des
-- fournisseurs de paiement/email/SMS, suppression de boutique) est
-- déjà réservée à 'admin'/'owner'. Cette phase ajoute une restriction
-- OPTIONNELLE, à la carte, sur deux zones précises pour les membres
-- simples : les finances (chiffre d'affaires, facturation) et les
-- réglages boutique — jamais une réduction silencieuse de l'existant :
-- `permissions IS NULL` (valeur par défaut) veut dire accès complet,
-- exactement comme avant cette migration, pour tout membre déjà en
-- place. Owner/admin ne sont jamais concernés : ils gardent un accès
-- total, quel que soit le contenu de cette colonne pour eux.

-- ============================================================
-- 1. Colonne de permissions — tableau de clés, jamais un rôle de plus
--    (le rôle reste owner/admin/member, cette colonne ne fait que
--    RESTREINDRE un membre simple sur des zones précises, jamais
--    élargir ses droits au-delà de ce qu'un membre peut déjà faire).
-- ============================================================
alter table organization_members add column if not exists permissions text[];
alter table organization_invitations add column if not exists permissions text[];

-- ============================================================
-- 2. Fonction de vérification — mêmes principes anti-contournement
--    que les autres fonctions SECURITY DEFINER du projet (jamais un
--    id fourni par le client, toujours re-résolu depuis auth.uid()).
-- ============================================================
create or replace function member_has_permission(p_organization_id uuid, p_permission text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and (
        om.role in ('owner', 'admin')
        or om.permissions is null
        or p_permission = any(om.permissions)
      )
  );
$$;

-- Variante boutique (même principe que is_store_member/is_store_admin) :
-- resout l'organisation de la boutique puis délègue à la fonction
-- ci-dessus.
create or replace function member_has_store_permission(p_store_id uuid, p_permission text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select member_has_permission(stores.organization_id, p_permission)
  from stores
  where stores.id = p_store_id;
$$;

-- ============================================================
-- 3. Application réelle — réglages boutique (settings). Une seule
--    policy à modifier : `stores` porte déjà l'apparence, le
--    tracking et le domaine personnalisé (mêmes colonnes), donc une
--    seule restriction UPDATE couvre les trois formulaires.
-- ============================================================
drop policy if exists "stores_update_member" on stores;
create policy "stores_update_member" on stores
  for update using (member_has_permission(organization_id, 'settings'));

-- ============================================================
-- 4. Invitations : la permission proposée est gelée sur l'invitation
--    puis copiée telle quelle à l'acceptation — même principe que le
--    rôle (accept_organization_invitation ré-créée pour copier
--    `permissions` en plus de `role`).
-- ============================================================
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

  insert into organization_members (organization_id, user_id, role, permissions)
  values (v_invitation.organization_id, auth.uid(), v_invitation.role, v_invitation.permissions)
  returning * into v_member;

  update organization_invitations
  set status = 'accepted', accepted_at = now()
  where organization_invitations.id = v_invitation.id;

  return v_member;
end;
$$;

-- Note RLS : la policy "organization_members_update_admin" existante
-- (Phase 25) autorise déjà toute mise à jour de ligne par un
-- admin/owner sur un membre non-owner — une policy RLS s'applique à
-- la ligne entière, pas colonne par colonne, donc écrire aussi
-- `permissions` dans le même UPDATE est déjà couvert sans rien
-- changer à cette policy.
