-- 8Hope: Moed Reflection + Deeper Word Study (optional sections)
--
-- Generated once per (month, day, language) by the moed-extras edge
-- function, alongside — never replacing — the existing moed_daily_content.
-- Until released, only Moed reviewers (Pamela, Dr. Anita) can see them; they
-- review with Approve / Needs changes + a comment for as many days as they
-- need. Release is a single app_settings flag flipped after approval.

create table if not exists moed_daily_extras (
  id            uuid primary key default gen_random_uuid(),
  month         int  not null check (month between 1 and 12),
  day           int  not null check (day between 1 and 31),
  language      text not null default 'en',
  extras        jsonb not null,   -- 3 entries, same order as moed_daily_content.verses
  model         text not null,
  generated_at  timestamptz not null default now(),
  unique (month, day, language)
);

-- Deny-all: only the moed-extras edge function (service role) reads/writes.
alter table moed_daily_extras enable row level security;

create or replace function is_moed_reviewer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_profiles where id = auth.uid() and moed_reviewer);
$$;

create table if not exists moed_extras_reviews (
  id           uuid primary key default gen_random_uuid(),
  reviewer_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month        int  not null,
  day          int  not null,
  language     text not null default 'en',
  section      text not null check (section in ('reflection', 'deep_study')),
  verdict      text not null check (verdict in ('approve', 'changes')),
  comment      text,
  updated_at   timestamptz not null default now(),
  unique (reviewer_id, month, day, language, section)
);

alter table moed_extras_reviews enable row level security;

-- Reviewers see each other's feedback; each writes only their own.
create policy "Moed reviewers read reviews"
  on moed_extras_reviews for select
  using (is_moed_reviewer());

create policy "Moed reviewers write own reviews"
  on moed_extras_reviews for insert
  with check (reviewer_id = auth.uid() and is_moed_reviewer());

create policy "Moed reviewers update own reviews"
  on moed_extras_reviews for update
  using (reviewer_id = auth.uid() and is_moed_reviewer())
  with check (reviewer_id = auth.uid() and is_moed_reviewer());

-- ─── App-wide settings ──────────────────────────────────────────────────────

create table if not exists app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table app_settings enable row level security;

-- Readable by any signed-in user; changed only by migration / service role.
create policy "Signed-in users read app settings"
  on app_settings for select
  using (auth.role() = 'authenticated');

insert into app_settings (key, value) values ('moed_extras_released', 'false')
on conflict (key) do nothing;
