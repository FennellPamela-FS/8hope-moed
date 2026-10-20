-- 8Hope: cost tracking + per-feature access flags
--
-- 1. Access flags on user_profiles, all admin-only (same guard as
--    axios_enabled): is_admin (Costs & Pricing page), moed_reviewer (sees and
--    reviews unreleased Moed sections), bible_study_enabled (My Bible Study).
--    Plus user-writable Moed display preferences.
-- 2. ai_usage: one row per AI call — feature, model, token counts. Numbers
--    only; never anyone's words. Written by edge functions (service role).
-- 3. ai_model_prices and fixed_costs feed the Costs & Pricing page.

-- ─── Access flags ───────────────────────────────────────────────────────────

alter table user_profiles add column if not exists is_admin            boolean not null default false;
alter table user_profiles add column if not exists moed_reviewer       boolean not null default false;
alter table user_profiles add column if not exists bible_study_enabled boolean not null default false;

-- User-controlled Moed display preferences (Settings → Moed Content).
alter table user_profiles add column if not exists moed_show_reflection   boolean not null default false;
alter table user_profiles add column if not exists moed_show_deep_study   boolean not null default false;
alter table user_profiles add column if not exists moed_extras_intro_seen boolean not null default false;

create or replace function guard_axios_enabled()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and (
       new.axios_enabled       is distinct from old.axios_enabled
    or new.is_admin            is distinct from old.is_admin
    or new.moed_reviewer       is distinct from old.moed_reviewer
    or new.bible_study_enabled is distinct from old.bible_study_enabled
  ) then
    raise exception 'access flags can only be changed by an administrator';
  end if;
  return new;
end;
$$;

create or replace function is_app_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_profiles where id = auth.uid() and is_admin);
$$;

-- ─── AI usage ───────────────────────────────────────────────────────────────

create table if not exists ai_usage (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  user_id         uuid references auth.users(id) on delete set null,
  feature         text not null,   -- e.g. 'axios-guide', 'moed-daily', 'study-insight'
  model           text not null,
  input_tokens    int  not null default 0,
  output_tokens   int  not null default 0,   -- answer tokens
  thinking_tokens int  not null default 0,   -- billed as output
  ok              boolean not null default true
);

create index if not exists ai_usage_created_idx on ai_usage (created_at desc);

alter table ai_usage enable row level security;

create policy "Admins read AI usage"
  on ai_usage for select
  using (is_app_admin());

-- ─── Prices & fixed costs ───────────────────────────────────────────────────

create table if not exists ai_model_prices (
  model         text primary key,
  input_per_m   numeric(10,4) not null,   -- USD per 1M input tokens, list price
  output_per_m  numeric(10,4) not null,   -- USD per 1M output (incl. thinking) tokens
  note          text,
  updated_at    timestamptz not null default now()
);

alter table ai_model_prices enable row level security;

create policy "Admins manage model prices"
  on ai_model_prices for all
  using (is_app_admin())
  with check (is_app_admin());

insert into ai_model_prices (model, input_per_m, output_per_m, note) values
  ('gemini-3.6-flash', 1.50, 7.50, 'List price per Google AI Studio notice (Oct 2026). 50% promotional discount currently applies.'),
  ('gemini-2.5-flash', 0.30, 2.50, 'Last published list price — verify in Google AI Studio billing.')
on conflict (model) do nothing;

create table if not exists fixed_costs (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  monthly_usd  numeric(10,2) not null default 0,
  note         text,
  created_at   timestamptz not null default now()
);

alter table fixed_costs enable row level security;

create policy "Admins manage fixed costs"
  on fixed_costs for all
  using (is_app_admin())
  with check (is_app_admin());

-- Starting rows with $0 for Pamela to fill in from her actual invoices.
insert into fixed_costs (name, monthly_usd, note) values
  ('Supabase', 0, 'Database, sign-in, edge functions — enter current plan'),
  ('Netlify', 0, 'Hosting — enter current plan'),
  ('API.Bible', 0, 'Bible text — confirm plan covers commercial use'),
  ('Domain', 0, 'Annual cost ÷ 12'),
  ('Email sending', 0, 'Needed for public sign-ups (built-in email is rate-limited)');

-- Active users for the cost page (admin only).
create or replace function admin_active_users(days int)
returns int language sql stable security definer set search_path = public, auth as $$
  select case when is_app_admin() then
    (select count(*)::int from auth.users where last_sign_in_at > now() - make_interval(days => days))
  else null end;
$$;

-- ─── Rollout ────────────────────────────────────────────────────────────────

update user_profiles set is_admin = true, moed_reviewer = true, bible_study_enabled = true
where lower(email) = 'pfennell@mytcreative.com';

update user_profiles set moed_reviewer = true
where lower(email) = 'amckaney@mytcreative.com';
