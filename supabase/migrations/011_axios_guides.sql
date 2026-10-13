-- 8Hope: AXIOS Phase 2
-- 1. Rolls AXIOS out to Dr. Anita's account (she still opts in herself;
--    nothing is pre-loaded for her).
-- 2. Adds the 7-day meditation guide: one AI-generated guide per word,
--    written by the axios-guide edge function and saved so it is generated
--    once — regenerated only after the word's anchors change (any anchor
--    updated after generated_at, or the anchor count differs).

update user_profiles set axios_enabled = true
where lower(email) = 'amckaney@mytcreative.com';

create table if not exists axios_guides (
  id            uuid primary key default gen_random_uuid(),
  word_id       uuid not null unique references axios_words(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  days          jsonb not null,   -- array of exactly 7 guide days
  anchor_count  int  not null,
  model         text not null,
  generated_at  timestamptz not null default now()
);

alter table axios_guides enable row level security;

create policy "AXIOS members manage own guides"
  on axios_guides for all
  using (auth.uid() = user_id and is_axios_member())
  with check (
    auth.uid() = user_id and is_axios_member()
    and exists (select 1 from axios_words w where w.id = word_id and w.user_id = auth.uid())
  );
