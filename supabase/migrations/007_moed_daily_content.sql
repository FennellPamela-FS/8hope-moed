-- 8Hope: Moed daily content cache
-- Server-generated-once cache of "The Moed" 3-verse content, keyed by
-- (month, day) = Gregorian chapter:verse coordinate. Content for a given
-- coordinate (e.g. Aug 13 = 8:13) is identical every year — generated once
-- by the daily-verses edge function on first request, reused forever after.

create table if not exists moed_daily_content (
  id                uuid primary key default gen_random_uuid(),
  month             int  not null check (month between 1 and 12),
  day               int  not null check (day between 1 and 31),
  verses            jsonb not null,   -- array of exactly 3 MoedVerseOption objects
  generator_version text not null default 'gemini-2.5-flash-v1',
  generated_at      timestamptz not null default now(),
  unique (month, day)
);

comment on table moed_daily_content is
  'Server-generated-once cache of "The Moed" 3-verse content, keyed by '
  '(month, day) = Gregorian chapter:verse coordinate. Content for a given '
  'coordinate (e.g. Aug 13 = 8:13) is identical every year. Written only by '
  'the daily-verses edge function (service role); never queried directly '
  'by the frontend. Verse text itself is NOT cached here — it is fetched '
  'live per the user''s selected Bible version, same as before.';

alter table moed_daily_content enable row level security;
-- Deliberate deny-all: only the edge function (service_role, bypasses RLS)
-- ever touches this table. Unlike the verse_map incident (see migration
-- 006), there is no anon/authenticated reader to accidentally lock out —
-- this is RLS-enabled-with-zero-policies used correctly and on purpose.
