-- BYA Flow — Phase 45 : SMS / WhatsApp réels (Twilio)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase44_email_marketing.sql.
--
-- Directive Section 19 : même discipline que la Phase 44 (email) —
-- jamais de faux "envoyé" sans provider réel, jamais de credentials
-- inventés. Terrain préparé : l'utilisateur connectera son propre
-- compte Twilio plus tard via les paramètres en libre-service.
-- Twilio expose UNE seule API pour SMS et WhatsApp (même endpoint
-- Messages.json, seul le préfixe "whatsapp:" sur From/To change) —
-- confirmé sur la documentation officielle Twilio avant écriture,
-- donc un seul compte/provider couvre les deux canaux.

-- ============================================================
-- 1. Configuration Twilio — par organisation, même principe que
--    email_provider_settings (Phase 44) : admin/propriétaire
--    uniquement, un Auth Token est un secret.
-- ============================================================
create table if not exists messaging_provider_settings (
  organization_id uuid primary key references organizations(id) on delete cascade,
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_sms_from text,
  twilio_whatsapp_from text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on messaging_provider_settings;
create trigger set_updated_at before update on messaging_provider_settings
  for each row execute function set_updated_at();

alter table messaging_provider_settings enable row level security;

create policy "messaging_provider_settings_select_admin" on messaging_provider_settings
  for select using (is_org_admin(organization_id));
create policy "messaging_provider_settings_insert_admin" on messaging_provider_settings
  for insert with check (is_org_admin(organization_id));
create policy "messaging_provider_settings_update_admin" on messaging_provider_settings
  for update using (is_org_admin(organization_id));

-- Aucune nouvelle colonne nécessaire sur campaign_recipients : les
-- colonnes status/error_message/sent_at ajoutées en Phase 44 sont
-- déjà génériques à tout canal (email, sms, whatsapp).
