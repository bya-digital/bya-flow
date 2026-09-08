-- BYA Flow — Phase 35 : premier vrai paiement (Kkiapay)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase34_domaine_personnalise.sql.
--
-- Première intégration de paiement réellement connectée (les 7 autres
-- fournisseurs restent une architecture prête, pas branchée). Détails
-- d'API Kkiapay confirmés dans le SDK PHP officiel (github.com/kkiapay/php-sdk)
-- le 2026-09-08, jamais inventés.
--
-- Toujours aucune clé service_role : la vérification du paiement se fait
-- par deux fonctions SECURITY DEFINER étroitement ciblées (même principe
-- que get_active_order_webhooks en Phase 31), jamais par un rôle qui
-- contournerait globalement la RLS.

-- Empêche un doublon de transaction si la confirmation côté client et le
-- webhook arrivent tous les deux pour le même paiement.
alter table payment_transactions
  add constraint payment_transactions_order_provider_ref_key
  unique (order_id, provider, provider_reference);

-- Renvoie la configuration d'un fournisseur de paiement actif pour la
-- boutique d'une commande donnée, sans exiger de session (le
-- checkout est encore anonyme à ce stade) — le secret ne quitte jamais
-- le serveur Node ensuite : il sert uniquement à l'appel HTTP vers
-- l'API Kkiapay, jamais renvoyé au navigateur du client.
create or replace function get_payment_provider_config(p_order_id uuid, p_provider text)
returns table (
  config jsonb,
  expected_amount numeric,
  expected_currency text,
  current_payment_status text
)
language sql
security definer
set search_path = public
stable
as $$
  select pp.config, o.total, s.currency, o.payment_status
  from orders o
  join stores s on s.id = o.store_id
  join payment_providers pp on pp.store_id = o.store_id and pp.provider = p_provider
  where o.id = p_order_id and pp.is_active = true;
$$;

-- Marque une commande payée — jamais appelée avec un montant/statut fourni
-- tel quel par le client : toujours après un appel serveur→Kkiapay
-- (checkStatus()) qui a lui-même vérifié la transaction. Idempotente :
-- un webhook et une confirmation côté client peuvent arriver deux fois
-- pour le même paiement sans double effet.
create or replace function confirm_order_payment(
  p_order_id uuid,
  p_provider text,
  p_provider_reference text,
  p_verified_amount numeric,
  p_verified_status text
)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders;
  v_currency text;
  v_already_succeeded boolean;
begin
  select * into v_order from orders where id = p_order_id;
  if v_order.id is null then
    raise exception 'Commande introuvable.';
  end if;

  select currency into v_currency from stores where id = v_order.store_id;

  select exists (
    select 1 from payment_transactions
    where order_id = p_order_id and provider = p_provider
      and provider_reference = p_provider_reference and status = 'succeeded'
  ) into v_already_succeeded;

  if v_already_succeeded then
    return v_order;
  end if;

  if p_verified_status <> 'succeeded' or p_verified_amount is null or p_verified_amount < v_order.total then
    insert into payment_transactions (order_id, provider, status, amount, currency, provider_reference)
    values (p_order_id, p_provider, 'failed', coalesce(p_verified_amount, 0), v_currency, p_provider_reference)
    on conflict (order_id, provider, provider_reference) do nothing;
    return v_order;
  end if;

  insert into payment_transactions (order_id, provider, status, amount, currency, provider_reference)
  values (p_order_id, p_provider, 'succeeded', p_verified_amount, v_currency, p_provider_reference)
  on conflict (order_id, provider, provider_reference)
  do update set status = 'succeeded', amount = excluded.amount;

  update orders
  set payment_status = 'paid',
      status = case when status = 'pending' then 'confirmed' else status end
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;
