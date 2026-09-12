-- BYA Flow — Phase 46 : Tracking (Meta Pixel / Google Analytics 4 / GTM)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase45_whatsapp_sms.sql.
--
-- Directive Section 20. Contrairement aux Phases 44/45, un Pixel ID,
-- un Measurement ID GA4 ou un Container ID GTM ne sont pas des
-- secrets : ils sont systématiquement visibles dans le code source de
-- toute page qui les utilise (c'est leur fonctionnement normal). Pas
-- de nouvelle table ni de RLS dédiée : simples colonnes sur `stores`,
-- déjà protégée par les policies existantes (seul un membre de
-- l'organisation peut modifier sa propre boutique).

alter table stores add column if not exists meta_pixel_id text;
alter table stores add column if not exists ga4_measurement_id text;
alter table stores add column if not exists gtm_container_id text;
