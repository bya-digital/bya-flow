-- BYA Flow — Phase 44 : Email marketing réel
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase43_crm_rfm.sql.
--
-- "Le système actuel ne doit pas prétendre envoyer des emails
-- marketing s'il n'existe pas de provider réel" (directive Section 18).
-- Les campagnes restent en mode "envoi simulé" (comportement Phase 7
-- inchangé) tant qu'aucune clé Resend n'est configurée — jamais de
-- credentials inventés, jamais un faux "envoyé" sans provider réel.

-- ============================================================
-- 1. Configuration Resend — par organisation (les campagnes sont déjà
--    partagées entre boutiques d'une même organisation, comme le CRM).
--    Réservée admin/propriétaire, même principe que payment_providers
--    (Phase 35B) : une clé API est un secret, jamais lisible par un
--    simple membre.
-- ============================================================
create table if not exists email_provider_settings (
  organization_id uuid primary key references organizations(id) on delete cascade,
  resend_api_key text,
  sender_email text,
  sender_name text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on email_provider_settings;
create trigger set_updated_at before update on email_provider_settings
  for each row execute function set_updated_at();

alter table email_provider_settings enable row level security;

create policy "email_provider_settings_select_admin" on email_provider_settings
  for select using (is_org_admin(organization_id));
create policy "email_provider_settings_insert_admin" on email_provider_settings
  for insert with check (is_org_admin(organization_id));
create policy "email_provider_settings_update_admin" on email_provider_settings
  for update using (is_org_admin(organization_id));

-- ============================================================
-- 2. Ciblage par segment RFM (Phase 43) en plus des tags/statut déjà
--    existants — calculé à l'échelle de l'organisation (le CRM est
--    déjà partagé entre boutiques d'une même organisation), jamais
--    une seule boutique si l'organisation en a plusieurs.
-- ============================================================
alter table campaigns add column if not exists audience_segment text
  check (audience_segment is null or audience_segment in ('new', 'vip', 'at_risk', 'inactive', 'active'));

create or replace function get_customer_rfm_by_org(p_organization_id uuid)
returns table (
  customer_id uuid,
  order_count bigint,
  total_spent numeric,
  first_order_at timestamptz,
  last_order_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select o.customer_id, count(*), sum(o.total), min(o.created_at), max(o.created_at)
  from orders o
  join stores s on s.id = o.store_id
  where s.organization_id = p_organization_id
    and o.customer_id is not null
    and is_org_member(p_organization_id)
  group by o.customer_id;
$$;

-- ============================================================
-- 3. Suivi réel par destinataire — la Phase 7 ne loggait que "ciblé",
--    jamais un vrai statut d'envoi.
-- ============================================================
alter table campaign_recipients add column if not exists status text not null default 'pending'
  check (status in ('pending', 'sent', 'failed'));
alter table campaign_recipients add column if not exists error_message text;
alter table campaign_recipients add column if not exists sent_at timestamptz;

-- Policy manquante depuis la Phase 7 : rien ne permettait de mettre à
-- jour un destinataire après l'avoir inséré (nécessaire pour marquer
-- sent/failed une fois l'appel Resend réellement fait).
create policy "campaign_recipients_update_member" on campaign_recipients
  for update using (is_campaign_member(campaign_id));
