-- BYA Flow — Phase 8 : automatisations (déclencheur → condition → action)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase7_marketing.sql.
--
-- Portée assumée : les déclencheurs événementiels (commande créée/livrée,
-- panier abandonné) sont réellement automatiques via des triggers Postgres.
-- Le déclencheur temporel ("client inactif depuis N jours") n'a pas de
-- planification automatique ici (pas de pg_cron activé par précaution) :
-- il s'exécute à la demande depuis l'interface. La seule action disponible
-- est la création d'une notification interne — aucun fournisseur email/SMS
-- n'est connecté (même logique qu'en Phase 7 pour les campagnes).

-- =========================================================
-- Tables
-- =========================================================

create table automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  trigger_type text not null
    check (trigger_type in ('order_created', 'order_delivered', 'cart_abandoned', 'customer_inactive')),
  trigger_config jsonb not null default '{}'::jsonb,
  action_type text not null default 'create_notification'
    check (action_type in ('create_notification')),
  action_title text not null,
  action_message text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references automations(id) on delete cascade,
  related_type text,
  related_id uuid,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  message text not null,
  related_type text,
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on automations;
create trigger set_updated_at before update on automations
  for each row execute function set_updated_at();

-- =========================================================
-- Fonctions d'accès
-- =========================================================

create or replace function is_automation_member(p_automation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from automations
    where automations.id = p_automation_id
      and is_org_member(automations.organization_id)
  );
$$;

-- =========================================================
-- Déclencheur : commande créée
-- =========================================================

create or replace function automations_notify_order_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_automation record;
  v_message text;
begin
  select organization_id into v_org_id from stores where id = new.store_id;

  for v_automation in
    select * from automations
    where organization_id = v_org_id
      and trigger_type = 'order_created'
      and is_active
  loop
    v_message := replace(v_automation.action_message, '{{order_number}}', new.order_number::text);
    insert into notifications (organization_id, title, message, related_type, related_id)
    values (v_org_id, v_automation.action_title, v_message, 'order', new.id);
    insert into automation_runs (automation_id, related_type, related_id)
    values (v_automation.id, 'order', new.id);
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_automations_order_created on orders;
create trigger trg_automations_order_created
  after insert on orders
  for each row execute function automations_notify_order_created();

-- =========================================================
-- Déclencheur : commande livrée
-- =========================================================

create or replace function automations_notify_order_delivered()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_automation record;
  v_message text;
begin
  if new.status = 'delivered' and (old.status is distinct from 'delivered') then
    select organization_id into v_org_id from stores where id = new.store_id;

    for v_automation in
      select * from automations
      where organization_id = v_org_id
        and trigger_type = 'order_delivered'
        and is_active
    loop
      v_message := replace(v_automation.action_message, '{{order_number}}', new.order_number::text);
      insert into notifications (organization_id, title, message, related_type, related_id)
      values (v_org_id, v_automation.action_title, v_message, 'order', new.id);
      insert into automation_runs (automation_id, related_type, related_id)
      values (v_automation.id, 'order', new.id);
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_automations_order_delivered on orders;
create trigger trg_automations_order_delivered
  after update on orders
  for each row execute function automations_notify_order_delivered();

-- =========================================================
-- Déclencheur : panier abandonné
-- =========================================================

create or replace function automations_notify_cart_abandoned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_automation record;
  v_message text;
  v_customer_name text;
begin
  if new.status = 'abandoned' and (old.status is distinct from 'abandoned') then
    select organization_id into v_org_id from stores where id = new.store_id;
    select full_name into v_customer_name from customers where id = new.customer_id;

    for v_automation in
      select * from automations
      where organization_id = v_org_id
        and trigger_type = 'cart_abandoned'
        and is_active
    loop
      v_message := replace(v_automation.action_message, '{{customer_name}}', coalesce(v_customer_name, 'Client'));
      insert into notifications (organization_id, title, message, related_type, related_id)
      values (v_org_id, v_automation.action_title, v_message, 'cart', new.id);
      insert into automation_runs (automation_id, related_type, related_id)
      values (v_automation.id, 'cart', new.id);
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_automations_cart_abandoned on carts;
create trigger trg_automations_cart_abandoned
  after update on carts
  for each row execute function automations_notify_cart_abandoned();

-- =========================================================
-- Déclencheur temporel : client inactif (exécution à la demande)
-- =========================================================

create or replace function run_customer_inactivity_check(p_organization_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_automation record;
  v_customer record;
  v_message text;
  v_count integer := 0;
  v_last_order_at timestamptz;
  v_days integer;
begin
  if not is_org_member(p_organization_id) then
    return 0;
  end if;

  for v_automation in
    select * from automations
    where organization_id = p_organization_id
      and trigger_type = 'customer_inactive'
      and is_active
  loop
    v_days := coalesce((v_automation.trigger_config ->> 'days')::int, 60);

    for v_customer in
      select * from customers where organization_id = p_organization_id
    loop
      select max(o.created_at) into v_last_order_at
      from orders o
      join stores s on s.id = o.store_id
      where o.customer_id = v_customer.id and s.organization_id = p_organization_id;

      if (
        (v_last_order_at is null and v_customer.created_at < now() - (v_days || ' days')::interval)
        or (v_last_order_at is not null and v_last_order_at < now() - (v_days || ' days')::interval)
      ) and not exists (
        select 1 from automation_runs ar
        where ar.automation_id = v_automation.id
          and ar.related_type = 'customer'
          and ar.related_id = v_customer.id
          and ar.created_at > now() - (v_days || ' days')::interval
      ) then
        v_message := replace(
          replace(v_automation.action_message, '{{customer_name}}', v_customer.full_name),
          '{{days}}',
          v_days::text
        );
        insert into notifications (organization_id, title, message, related_type, related_id)
        values (p_organization_id, v_automation.action_title, v_message, 'customer', v_customer.id);
        insert into automation_runs (automation_id, related_type, related_id)
        values (v_automation.id, 'customer', v_customer.id);
        v_count := v_count + 1;
      end if;
    end loop;
  end loop;

  return v_count;
end;
$$;

-- =========================================================
-- RLS
-- =========================================================

alter table automations enable row level security;
alter table automation_runs enable row level security;
alter table notifications enable row level security;

create policy "automations_select_member" on automations
  for select using (is_org_member(organization_id));
create policy "automations_insert_member" on automations
  for insert with check (is_org_member(organization_id));
create policy "automations_update_member" on automations
  for update using (is_org_member(organization_id));
create policy "automations_delete_member" on automations
  for delete using (is_org_member(organization_id));

create policy "automation_runs_select_member" on automation_runs
  for select using (is_automation_member(automation_id));

create policy "notifications_select_member" on notifications
  for select using (is_org_member(organization_id));
create policy "notifications_update_member" on notifications
  for update using (is_org_member(organization_id));

-- Pas de policy d'insertion sur automation_runs / notifications : elles ne
-- sont écrites que par les fonctions SECURITY DEFINER ci-dessus.
