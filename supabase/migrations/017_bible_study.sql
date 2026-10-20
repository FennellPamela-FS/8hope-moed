-- 8Hope: My Bible Study
--
-- Built from Pamela's "2025 Study: Mark - Luke" pattern: read a page a day
-- from each book in a paper Bible (MEV), log the passage, and work it through
-- "The Sovereign Study" — Read, Scribe, Pray, Ingest, Lead — every step
-- optional. Each book carries a lens (Mark = The Lion, Luke = The Eagle).
-- Gated by user_profiles.bible_study_enabled (Pamela first); owner-only.

create or replace function is_bible_study_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_profiles where id = auth.uid() and bible_study_enabled);
$$;

create table if not exists study_plans (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  version_label  text not null default 'MEV',   -- the Bible the user reads (may be paper)
  created_at     timestamptz not null default now()
);

create table if not exists study_plan_books (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references study_plans(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  position        int  not null default 0,
  book            text not null,   -- USFM code, e.g. 'MRK'
  lens_name       text,            -- e.g. 'The Lion'
  lens_focus      text,            -- e.g. 'Authority, Action, and Speed'
  total_chapters  int  not null,
  next_chapter    int  not null default 1,
  next_verse      int  not null default 1,
  unique (plan_id, book)
);

create table if not exists study_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  plan_id        uuid not null references study_plans(id) on delete cascade,
  book           text not null,
  entry_date     date not null default current_date,
  start_chapter  int  not null,
  start_verse    int  not null,
  end_chapter    int  not null,
  end_verse      int  not null,
  version_label  text not null default 'MEV',
  read_text      text,   -- 1. READ (optional pasted Scripture)
  scribe         text,   -- 2. SCRIBE
  pray           text,   -- 3. PRAY
  ingest         text,   -- 4. INGEST
  lead           text,   -- 5. LEAD
  notes          text,   -- free notes, outside the template
  tags           text[] not null default '{}',   -- Word Watch
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists study_entries_user_date_idx on study_entries (user_id, entry_date desc);

create table if not exists study_insights (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references study_entries(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  question    text,
  eagle       text not null,
  lion        text not null,
  model       text not null,
  created_at  timestamptz not null default now()
);

alter table study_plans      enable row level security;
alter table study_plan_books enable row level security;
alter table study_entries    enable row level security;
alter table study_insights   enable row level security;

create policy "Study members manage own plans" on study_plans for all
  using (auth.uid() = user_id and is_bible_study_member())
  with check (auth.uid() = user_id and is_bible_study_member());

create policy "Study members manage own plan books" on study_plan_books for all
  using (auth.uid() = user_id and is_bible_study_member())
  with check (auth.uid() = user_id and is_bible_study_member()
    and exists (select 1 from study_plans p where p.id = plan_id and p.user_id = auth.uid()));

create policy "Study members manage own entries" on study_entries for all
  using (auth.uid() = user_id and is_bible_study_member())
  with check (auth.uid() = user_id and is_bible_study_member()
    and exists (select 1 from study_plans p where p.id = plan_id and p.user_id = auth.uid()));

create policy "Study members manage own insights" on study_insights for all
  using (auth.uid() = user_id and is_bible_study_member())
  with check (auth.uid() = user_id and is_bible_study_member()
    and exists (select 1 from study_entries e where e.id = entry_id and e.user_id = auth.uid()));

-- ─── Pamela's plan, picking up where her Google Doc leaves off ──────────────
-- Mark read through 7:37 (8:1-31 was set up next); Luke through 5:39.

do $$
declare
  owner_id uuid;
  new_plan_id uuid;
begin
  select id into owner_id from auth.users where lower(email) = 'pfennell@mytcreative.com';
  if owner_id is null or exists (select 1 from study_plans where user_id = owner_id) then
    return;
  end if;

  insert into study_plans (user_id, title, version_label)
  values (owner_id, 'Mark – Luke Study', 'MEV')
  returning id into new_plan_id;

  insert into study_plan_books (plan_id, user_id, position, book, lens_name, lens_focus, total_chapters, next_chapter, next_verse) values
    (new_plan_id, owner_id, 1, 'MRK', 'The Lion',  'Authority, Action, and Speed',          16, 8, 1),
    (new_plan_id, owner_id, 2, 'LUK', 'The Eagle', 'Humanity, Detail, Systems, and Healing', 24, 6, 1);
end;
$$;
