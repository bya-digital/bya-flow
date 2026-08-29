-- BYA Flow — Phase 15 : espace Admin Plateforme
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase12_facturation.sql.
--
-- Contexte : BYA Digital (l'opérateur de la plateforme SaaS) n'a aujourd'hui
-- aucune vue transverse sur les organisations clientes créées via
-- l'onboarding — chaque organisation est isolée par RLS, y compris pour
-- l'opérateur. Cette phase ajoute un rôle "admin plateforme", orthogonal
-- aux rôles owner/admin/member (qui restent scoping à UNE organisation),
-- avec un accès en lecture cross-tenant volontairement limité aux
-- informations de pilotage commercial (organisations, plans, effectifs) —
-- pas aux données métier de chaque client (produits, commandes, clients).

alter table profiles
  add column if not exists is_platform_admin boolean not null default false;

create or replace function is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_platform_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- Lecture cross-tenant pour l'admin plateforme (en plus des policies
-- existantes scoping par organisation, inchangées).
create policy "organizations_select_platform_admin" on organizations
  for select using (is_platform_admin());

create policy "organization_members_select_platform_admin" on organization_members
  for select using (is_platform_admin());

create policy "stores_select_platform_admin" on stores
  for select using (is_platform_admin());

create policy "subscriptions_select_platform_admin" on subscriptions
  for select using (is_platform_admin());

-- Seule écriture accordée : changer le plan d'un client en support manuel
-- (aucune passerelle de paiement connectée, voir phase12_facturation.sql).
create policy "subscriptions_update_platform_admin" on subscriptions
  for update using (is_platform_admin());

-- Pour accorder ce rôle à un compte, exécuter manuellement (aucune UI ne le
-- permet, volontairement, pour éviter qu'un client puisse jamais se
-- l'auto-attribuer) :
--
-- update profiles set is_platform_admin = true
-- where id = (select id from auth.users where email = 'votre-email@exemple.com');
