-- 8Hope: Favorites & Journal tables

-- Favorite Verses
create table if not exists user_favorites (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  book          text not null,
  chapter       int not null,
  verse         int not null,
  verse_text    text not null,
  bible_version text not null default 'KJV',
  notes         text,
  date_saved    timestamptz default now()
);

alter table user_favorites enable row level security;

create policy "Users manage own favorites"
  on user_favorites for all
  using (auth.uid() = user_id);

-- Journal Entries
create table if not exists journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  entry_date    date not null default current_date,
  content       text not null,
  watch_session text references prayer_watches(watch_key),
  verse_refs    jsonb default '[]',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (user_id, entry_date)
);

alter table journal_entries enable row level security;

create policy "Users manage own journal"
  on journal_entries for all
  using (auth.uid() = user_id);

-- Auto-update updated_at on journal
create or replace function update_journal_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger journal_updated_at
  before update on journal_entries
  for each row execute procedure update_journal_timestamp();
