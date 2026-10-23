-- 8Hope: (1) renumber the prayer watches from sundown, (2) saved pricing
-- scenarios for Count the Costs.
--
-- (1) The biblical day begins at sundown (Genesis 1:5), so the First Watch
-- is 6–9 PM — the Roman four-watch night of the Gospels (Mark 13:35;
-- Matthew 14:25). Only numbers and labels change: watch_key stays tied to
-- the HOURS (watch_1 is now the Eighth Watch, 3–6 PM), so saved Divine
-- Times, journal entries and AXIOS pairings keep their hours.

update prayer_watches set watch_number = 8, label = 'Eighth Watch'  where watch_key = 'watch_1';
update prayer_watches set watch_number = 1, label = 'First Watch'   where watch_key = 'watch_2';
update prayer_watches set watch_number = 2, label = 'Second Watch'  where watch_key = 'watch_3';
update prayer_watches set watch_number = 3, label = 'Third Watch'   where watch_key = 'watch_4';
update prayer_watches set watch_number = 4, label = 'Fourth Watch'  where watch_key = 'watch_5';
update prayer_watches set watch_number = 5, label = 'Fifth Watch'   where watch_key = 'watch_6';
update prayer_watches set watch_number = 6, label = 'Sixth Watch'   where watch_key = 'watch_7';
update prayer_watches set watch_number = 7, label = 'Seventh Watch' where watch_key = 'watch_8';

-- (2) A saved scenario = the calculator inputs plus a snapshot of the
-- numbers at the moment of saving, so it can be reopened or exported later.
create table if not exists pricing_scenarios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  inputs      jsonb not null,
  snapshot    jsonb not null,
  created_at  timestamptz not null default now()
);

alter table pricing_scenarios enable row level security;

create policy "Admins manage own pricing scenarios"
  on pricing_scenarios for all
  using (auth.uid() = user_id and is_app_admin())
  with check (auth.uid() = user_id and is_app_admin());
