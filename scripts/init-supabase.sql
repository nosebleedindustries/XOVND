-- XOVND Supabase schema — closed-beta phase
-- Run via: node scripts/run-sql.mjs

create extension if not exists "pgcrypto";

-- Leads: people who filled the "Request access" form on the site
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  platform    text,
  handle      text,
  signed_at   timestamptz not null default now(),
  source      text default 'web'
);
create index if not exists leads_email_idx     on public.leads (email);
create index if not exists leads_signed_at_idx on public.leads (signed_at desc);

-- Redemptions: every time someone redeems a beta/buyer code
create table if not exists public.redemptions (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,
  type          text not null check (type in ('beta','buyer')),
  user_email    text,
  user_name     text,
  redeemed_at   timestamptz not null default now(),
  user_agent    text
);
create index if not exists redemptions_code_idx        on public.redemptions (code);
create index if not exists redemptions_redeemed_at_idx on public.redemptions (redeemed_at desc);

-- RLS: anon can INSERT only; reading happens via service-role from /admin
alter table public.leads       enable row level security;
alter table public.redemptions enable row level security;

drop policy if exists "anon can insert leads"       on public.leads;
drop policy if exists "anon can insert redemptions" on public.redemptions;
create policy "anon can insert leads"
  on public.leads for insert to anon with check (true);
create policy "anon can insert redemptions"
  on public.redemptions for insert to anon with check (true);

-- Sanity check
select 'leads' as table_name, count(*) as rows from public.leads
union all
select 'redemptions', count(*) from public.redemptions;
