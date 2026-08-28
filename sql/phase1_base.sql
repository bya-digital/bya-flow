-- BYA Flow — schéma de base (phase 1)
-- À exécuter dans Supabase SQL editor.

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  last_name text,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  event_type text not null check (event_type in ('sent', 'opened', 'clicked', 'bounced')),
  created_at timestamptz not null default now()
);

alter table contacts enable row level security;
alter table campaigns enable row level security;
alter table campaign_events enable row level security;
