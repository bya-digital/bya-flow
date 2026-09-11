-- BYA Flow — Phase 43 : CRM avancé (segmentation RFM)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase42_upsell_downsell.sql.
--
-- Récence/Fréquence/Montant agrégés par client, pour une boutique —
-- le calcul du score (quintiles) et le classement en segments (VIP,
-- à risque, inactif, nouveau) se fait côté application (lib/data/crm.ts),
-- car il doit s'adapter à la distribution réelle de CHAQUE boutique
-- (directive : "segments dynamiques basés sur les données réelles"),
-- pas à des seuils absolus arbitraires identiques pour toutes.

create or replace function get_customer_rfm(p_store_id uuid)
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
  where o.store_id = p_store_id
    and o.customer_id is not null
    and is_store_member(p_store_id)
  group by o.customer_id;
$$;
