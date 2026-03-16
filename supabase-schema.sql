-- ============================================================
-- Adflo Estimator — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Profiles ─────────────────────────────────────────────────
-- Extends Supabase auth.users with role info
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'sales'
                check (role in ('admin','team','sales','client')),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile; admins/team can read all
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: team read all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','team')
    )
  );

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'sales')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Logic Settings ────────────────────────────────────────────
-- Single row; team/admin can update
create table public.logic_settings (
  id                              text primary key default 'global',
  base_hours                      integer not null default 24,
  best_case_multiplier            numeric not null default 0.8,
  worst_case_multiplier           numeric not null default 1.3,
  learning_blend_cap              numeric not null default 0.6,
  min_projects_for_full_learning  integer not null default 20,
  tiers                           jsonb not null default '[
    {"name":"Bronze","min_hours":24,"timeline":"3–5 weeks"},
    {"name":"Silver","min_hours":60,"timeline":"5–8 weeks"},
    {"name":"Gold","min_hours":110,"timeline":"8–12 weeks"},
    {"name":"Enterprise","min_hours":180,"timeline":"12–16 weeks"}
  ]'::jsonb,
  updated_at  timestamptz default now(),
  updated_by  uuid references auth.users(id)
);

alter table public.logic_settings enable row level security;

create policy "logic_settings: anyone read"
  on public.logic_settings for select using (true);

create policy "logic_settings: team write"
  on public.logic_settings for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','team')
    )
  );

insert into public.logic_settings (id) values ('global') on conflict do nothing;

-- ── Questions ────────────────────────────────────────────────
create table public.questions (
  id          integer primary key,
  cat         text not null,
  q           text not null,
  trigger     text not null check (trigger in ('Yes','No')),
  weight      integer not null default 0,
  can_remove  boolean not null default false,
  lever_name  text,
  lever_desc  text,
  sort_order  integer not null default 0,
  active      boolean not null default true
);

alter table public.questions enable row level security;

create policy "questions: anyone read"
  on public.questions for select using (true);

create policy "questions: team write"
  on public.questions for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','team')
    )
  );

-- Seed questions
insert into public.questions (id,cat,q,trigger,weight,can_remove,lever_name,lever_desc,sort_order) values
(1,'Data & Structure','Do you currently use more than one system to manage orders or campaign data?','Yes',8,false,null,null,1),
(2,'Data & Structure','Will Adflo be the single source of truth for data?','Yes',10,false,null,null,2),
(3,'Data & Structure','Do you have more than 5 unique products or service types?','Yes',6,false,null,null,3),
(4,'Data & Structure','Do different products require different fields or data structures?','Yes',8,false,null,null,4),
(5,'Data & Structure','Do you need to import historical campaign/order data?','Yes',12,true,'Historical Data Import','Skip migrating historical data; start fresh',5),
(6,'Data & Structure','Do campaigns typically include multiple flights or phases?','Yes',4,false,null,null,6),
(7,'Data & Structure','Do multiple departments contribute different data inputs during campaign setup?','Yes',6,false,null,null,7),
(8,'Data & Structure','Do different teams currently follow different processes for the same campaign type?','Yes',12,false,null,null,8),
(9,'Workflow & Approvals','Do orders require more than one approval step before activation?','Yes',6,true,'Multi-Step Approvals','Use single-step approval flow instead',9),
(10,'Workflow & Approvals','Do approvals involve multiple departments (Sales, Finance, Ops, etc.)?','Yes',8,true,'Cross-Dept Approvals','Limit approvals to one department',10),
(11,'Workflow & Approvals','Do you require conditional workflow routing (if/then rules)?','Yes',10,true,'Conditional Routing','Use standard linear workflow only',11),
(12,'Workflow & Approvals','Do you require automated SLA tracking or deadlines in workflows?','Yes',6,true,'SLA Tracking','Manual deadline management instead',12),
(13,'Integrations','Will Adflo integrate with a CRM system?','Yes',12,true,'CRM Integration','Manual data entry between systems',13),
(14,'Integrations','Will Adflo integrate with proposal or quoting tools?','Yes',8,true,'Proposal Tool Integration','Remove proposal tool sync',14),
(15,'Integrations','Will Adflo integrate with billing or finance systems?','Yes',14,true,'Billing System Integration','Manual billing export instead',15),
(16,'Integrations','Will Adflo receive data from external platforms via API/webhook?','Yes',16,true,'Inbound API / Webhooks','Remove inbound data feeds; manual import',16),
(17,'Integrations','Do any integrations require bi-directional syncing?','Yes',18,true,'Bi-Directional Sync','One-way sync only (Adflo → external)',17),
(18,'Integrations','Will you require push connections to external vendors?','Yes',12,true,'Push Connectors','Remove vendor push connections entirely',18),
(19,'Configuration','Will you require multiple custom order forms?','Yes',6,true,'Custom Order Forms','Use standard order form template',19),
(20,'Configuration','Will you require custom product forms?','Yes',6,true,'Custom Product Forms','Use standard product form',20),
(21,'Configuration','Will you require custom task forms?','Yes',5,true,'Custom Task Forms','Use default task structure',21),
(22,'Configuration','Will the platform need to support multiple business units or brands?','Yes',10,true,'Multi-BU Support','Single business unit configuration',22),
(23,'Configuration','Will users require different permission levels or roles?','Yes',6,false,null,null,23),
(24,'Reporting & Financial Complexity','Do you require custom margin tracking?','Yes',6,true,'Custom Margin Tracking','Use standard margin reporting',24),
(25,'Reporting & Financial Complexity','Do you require custom financial reporting?','Yes',6,true,'Custom Financial Reports','Use out-of-box financial reports',25),
(26,'Reporting & Financial Complexity','Will campaigns need cost reconciliation?','Yes',6,true,'Cost Reconciliation','Skip reconciliation workflow',26),
(27,'Reporting & Financial Complexity','Will campaigns need COGS tracking?','Yes',6,true,'COGS Tracking','Remove COGS tracking module',27),
(28,'Reporting & Financial Complexity','Do you require billing automation or invoice generation?','Yes',10,true,'Billing Automation','Manual invoice creation instead',28),
(29,'Reporting & Financial Complexity','Will campaign revenue need to be adjusted via change orders?','Yes',6,true,'Change Orders','No change order module in phase 1',29),
(30,'Reporting & Financial Complexity','Will you need pacing data during the campaign?','Yes',4,true,'Pacing Data','Post-campaign reporting only',30),
(31,'Organizational Readiness','Do you have a dedicated internal implementation lead?','No',12,false,null,null,31),
(32,'Organizational Readiness','Do you have a dedicated technical resource for integrations?','No',10,false,null,null,32),
(33,'Organizational Readiness','Do you have documented current workflows?','No',10,false,null,null,33),
(34,'Organizational Readiness','Do stakeholders agree on how workflows should operate in the future?','No',12,false,null,null,34),
(35,'Scale','Will more than 20 users access the platform?','Yes',4,false,null,null,35),
(36,'Scale','Will more than one team or department use the system?','Yes',6,false,null,null,36),
(37,'Scale','Will the platform support more than one geographic market or region?','Yes',6,true,'Multi-Region Support','Single region launch first',37);

-- ── Sessions ─────────────────────────────────────────────────
create table public.sessions (
  id                uuid primary key default gen_random_uuid(),
  client_name       text not null,
  created_by        uuid not null references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  status            text not null default 'draft'
                      check (status in ('draft','submitted','reviewed','closed')),
  answers           jsonb not null default '{}'::jsonb,
  activated_levers  integer[] not null default '{}',
  estimated_hours   integer not null default 0,
  tier              text not null default 'Bronze',
  notes             text,
  share_token       text not null unique default encode(gen_random_bytes(24), 'base64url')
);

alter table public.sessions enable row level security;

-- Team/admin see all; sales see their own; client access via share_token (handled in API)
create policy "sessions: team see all"
  on public.sessions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','team')
    )
  );

create policy "sessions: sales own"
  on public.sessions for select
  using (auth.uid() = created_by);

create policy "sessions: sales insert"
  on public.sessions for insert
  with check (auth.uid() = created_by);

create policy "sessions: sales/team update own"
  on public.sessions for update
  using (
    auth.uid() = created_by or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','team')
    )
  );

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sessions_updated_at
  before update on public.sessions
  for each row execute procedure public.update_updated_at();

-- ── History ──────────────────────────────────────────────────
create table public.history (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references public.sessions(id) on delete set null,
  client_name       text not null,
  rep_name          text,
  date_completed    date not null,
  estimated_hours   integer not null,
  actual_hours      integer not null,
  tier              text not null,
  timeline          text not null,
  answers           jsonb not null default '{}'::jsonb,
  created_by        uuid not null references auth.users(id),
  created_at        timestamptz not null default now()
);

alter table public.history enable row level security;

create policy "history: team see all"
  on public.history for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','team')
    )
  );

create policy "history: sales own"
  on public.history for select
  using (auth.uid() = created_by);

create policy "history: team/sales insert"
  on public.history for insert
  with check (
    auth.uid() = created_by
  );

create policy "history: team delete"
  on public.history for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','team')
    )
  );

-- ── Learned Weights (computed view + manual override table) ──
create table public.learned_weight_overrides (
  question_id   integer primary key references public.questions(id),
  manual_weight integer,
  updated_at    timestamptz default now(),
  updated_by    uuid references auth.users(id)
);

alter table public.learned_weight_overrides enable row level security;

create policy "learned_weights: anyone read"
  on public.learned_weight_overrides for select using (true);

create policy "learned_weights: team write"
  on public.learned_weight_overrides for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','team')
    )
  );
