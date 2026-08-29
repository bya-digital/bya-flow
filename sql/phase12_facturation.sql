-- BYA Flow — Phase 12 : facturation SaaS
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase9_analytics.sql.
--
-- Aucune passerelle de paiement n'est connectée à ce stade (cahier des
-- charges : ne pas intégrer de service externe complexe sans nécessité).
-- Changer de plan est donc immédiat et gratuit ; les limites d'usage sont
-- réellement appliquées côté application (voir lib/actions/products.ts)
-- pour que la page de facturation ait un effet concret, pas seulement
-- décoratif.

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'business')),
  status text not null default 'active' check (status in ('active', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on subscriptions;
create trigger set_updated_at before update on subscriptions
  for each row execute function set_updated_at();

alter table subscriptions enable row level security;

create policy "subscriptions_select_member" on subscriptions
  for select using (is_org_member(organization_id));

create policy "subscriptions_update_admin" on subscriptions
  for update using (is_org_admin(organization_id));

-- Pas de policy d'insertion : la création d'un abonnement passe uniquement
-- par create_organization_with_owner() (SECURITY DEFINER, ci-dessous) ou
-- par le backfill unique suivant.

-- Backfill : les organisations créées avant cette phase n'ont pas encore
-- de ligne subscriptions ; on les passe toutes au plan gratuit.
insert into subscriptions (organization_id, plan, status)
select id, 'free', 'active' from organizations
on conflict (organization_id) do nothing;

-- Toute nouvelle organisation reçoit désormais un abonnement gratuit dès sa
-- création (fonction déjà existante depuis la Phase 2, remplacée ici pour
-- ajouter cette seule ligne).
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

  insert into subscriptions (organization_id, plan, status)
  values (v_org.id, 'free', 'active');

  return v_org;
end;
$$;
