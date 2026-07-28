-- 8Hope: Verse Map table
-- Maps each calendar month/day to 3 scripture references (The Moed system)
-- Month/Day determines Chapter/Verse pattern across 3 books

create table if not exists verse_map (
  id         uuid primary key default gen_random_uuid(),
  month      int not null check (month between 1 and 12),
  day        int not null check (day between 1 and 31),
  -- Verse 1: Psalms (M:D pattern)
  book_1     text not null default 'PSA',
  chapter_1  int not null,
  verse_1    int not null,
  -- Verse 2: Proverbs (M:D pattern)
  book_2     text not null default 'PRO',
  chapter_2  int not null,
  verse_2    int not null,
  -- Verse 3: NT book (rotates by month)
  book_3     text not null,
  chapter_3  int not null,
  verse_3    int not null,
  -- Optional daily theme override
  theme      text,
  created_at timestamptz default now(),
  unique (month, day)
);

-- NT book rotation by month (books with sufficient chapter/verse coverage)
-- Jan=Matthew, Feb=Mark, Mar=Luke, Apr=John, May=Acts, Jun=Romans
-- Jul=1Cor, Aug=2Cor, Sep=Galatians, Oct=Ephesians, Nov=Philippians, Dec=Colossians
-- Note: A seed script (supabase/functions/seed-verses) populates all 366 entries
-- using the M:D pattern with fallback to last available verse when out of range.

comment on table verse_map is
  'Maps calendar month/day to 3 scripture refs. Seeded via seed-verses edge function. '
  'Override theme column for special days (e.g., holidays, high holy days).';
