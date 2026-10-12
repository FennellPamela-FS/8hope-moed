-- 8Hope: AXIOS
-- A separate section of the app (not Moed) where a user keeps personal
-- prophetic words spoken over them, breaks each into anchors tied to
-- Scripture, memorizes them, and records a daily "walk matches the call"
-- check-in. Romans 8 is the base; Romans 8:18 is foundational, with
-- Ephesians 4:1 and Galatians 2:20 as anchors.
--
-- Access is two-step: an account must be enabled (axios_enabled, set only
-- by an admin/service role — rolled out to Pamela's account first), and the
-- user must opt in (axios_opted_in_at) before AXIOS stores anything for them.

-- ─── Access flags on user_profiles ──────────────────────────────────────────

alter table user_profiles add column if not exists axios_enabled boolean not null default false;
alter table user_profiles add column if not exists axios_opted_in_at timestamptz;

-- "Users can update own profile" would otherwise let anyone flip their own
-- axios_enabled on. Opt-in (axios_opted_in_at) stays user-writable.
create or replace function guard_axios_enabled()
returns trigger language plpgsql as $$
begin
  if new.axios_enabled is distinct from old.axios_enabled
     and coalesce(auth.role(), '') in ('anon', 'authenticated') then
    raise exception 'axios_enabled can only be changed by an administrator';
  end if;
  return new;
end;
$$;

create or replace trigger user_profiles_guard_axios_enabled
  before update on user_profiles
  for each row execute procedure guard_axios_enabled();

create or replace function is_axios_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_profiles
    where id = auth.uid() and axios_enabled
  );
$$;

-- ─── Words ──────────────────────────────────────────────────────────────────

create table if not exists axios_words (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  spoken_by    text,
  spoken_on    date,
  full_text    text,
  application  text,   -- how the user intends to walk the word out
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists axios_words_user_idx on axios_words (user_id, created_at desc);

-- ─── Anchors ────────────────────────────────────────────────────────────────
-- review_box / next_review_on drive memorize mode (Leitner boxes 0–4: a
-- known card moves up a box and comes back later; a missed one drops to 0).

create table if not exists axios_anchors (
  id              uuid primary key default gen_random_uuid(),
  word_id         uuid not null references axios_words(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  position        int  not null default 0,
  title           text not null,
  phrase          text not null,   -- the line to memorize
  explanation     text,
  verse_refs      jsonb not null default '[]',   -- [{book, chapter, verse}]
  review_box      int  not null default 0 check (review_box between 0 and 4),
  next_review_on  date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists axios_anchors_word_idx on axios_anchors (word_id, position);

-- ─── Daily check-ins (S ≡ L) ────────────────────────────────────────────────

create table if not exists axios_checkins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  checkin_date  date not null default current_date,
  walk_matched  text not null check (walk_matched in ('yes', 'partly', 'not_yet')),
  action_step   text,
  action_done   boolean not null default false,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, checkin_date)
);

-- ─── RLS: owner-only, and only for enabled accounts ─────────────────────────

alter table axios_words    enable row level security;
alter table axios_anchors  enable row level security;
alter table axios_checkins enable row level security;

create policy "AXIOS members manage own words"
  on axios_words for all
  using (auth.uid() = user_id and is_axios_member())
  with check (auth.uid() = user_id and is_axios_member());

create policy "AXIOS members manage own anchors"
  on axios_anchors for all
  using (auth.uid() = user_id and is_axios_member())
  with check (
    auth.uid() = user_id and is_axios_member()
    and exists (select 1 from axios_words w where w.id = word_id and w.user_id = auth.uid())
  );

create policy "AXIOS members manage own check-ins"
  on axios_checkins for all
  using (auth.uid() = user_id and is_axios_member())
  with check (auth.uid() = user_id and is_axios_member());

-- ─── Rollout: Pamela's account, with her first word pre-loaded ──────────────

update user_profiles set axios_enabled = true
where lower(email) = 'pfennell@mytcreative.com';

do $$
declare
  owner_id uuid;
  new_word_id uuid;
begin
  select id into owner_id from auth.users where lower(email) = 'pfennell@mytcreative.com';
  if owner_id is null then
    return;
  end if;
  if exists (select 1 from axios_words where user_id = owner_id and title = 'Word to AP Pam') then
    return;
  end if;

  insert into axios_words (user_id, title, full_text, application)
  values (
    owner_id,
    'Word to AP Pam',
    'A prophetic charge designating AP Pam as a Kingdom Resource & Allocation Officer — '
    'to find, secure, and allocate kingdom commodities, treasures, and warehouses; to ask '
    'boldly on behalf of builders; to fill the storehouse; and to hold the key of authority '
    'to the treasury of heaven. "As far as your eye can see." "If you can imagine it, I can '
    'produce it, says the Lord."',
    '1. Bridge S and L through stewardship protocols — enforce internal financial boundaries '
    '("Separate the Rivers" across the 9 functional accounts) and run "Hidden Oil Diagnostics" '
    'before acquiring new tools.' || chr(10) ||
    '2. Operate in rest rather than war — move out of perpetual warfare (the David era) into '
    'rest and building at scale (the Solomon era), so the walk (L) stays uncorrupted by trauma '
    'or exhaustion.' || chr(10) ||
    '3. Execute high-stakes asks — step into the office of Kingdom Allocation Officer: submit '
    'major grant proposals, establish institutional partnerships, and request funding on '
    'behalf of the ministry and community builders.'
  )
  returning id into new_word_id;

  insert into axios_anchors (word_id, user_id, position, title, phrase, explanation, verse_refs) values
  (new_word_id, owner_id, 1,
   'The Office & Identity',
   'I am a Kingdom Resource & Allocation Officer.',
   'Designated as "a resource, a resourcer, the office of resource, the resource manager of the kingdom," and the "allocation officer." The duty: to find, secure, and allocate kingdom commodities, treasures, and warehouses.',
   '[{"book":"LUK","chapter":12,"verse":42},{"book":"ROM","chapter":8,"verse":28}]'),
  (new_word_id, owner_id, 2,
   'The Multiplier Principle',
   'In the Spirit, what is in my hands is multiplied under Yeshua the Multiplier.',
   'Natural math says 1 + 1 = 2, but everything placed in your hands is subject to divine multiplication — as Yeshua fed the thousands with two fish and five loaves.',
   '[{"book":"JHN","chapter":6,"verse":11},{"book":"JHN","chapter":10,"verse":10}]'),
  (new_word_id, owner_id, 3,
   'The Nehemiah Mandate',
   'I ask for those who don''t know how to ask.',
   'Like Nehemiah asking the king for letters and timber, you are anointed to ask boldly on behalf of pastors and builders who lack the language or access, so supplies reach the house.',
   '[{"book":"NEH","chapter":2,"verse":8}]'),
  (new_word_id, owner_id, 4,
   'The Storehouse & Warehouse Directive',
   'Fill the storehouse.',
   'Leaders and pastors are suffering from a lack of support. You are charged to locate spiritual and physical warehouses sitting with resources and lock them down for the Kingdom.',
   '[{"book":"MAL","chapter":3,"verse":10}]'),
  (new_word_id, owner_id, 5,
   'The Key to the Treasury of Heaven',
   'A key of authority is in my hands to unlock the treasury of heaven.',
   'Spiritual access to locate hidden wealth and "honey on the hill."',
   '[{"book":"ISA","chapter":22,"verse":22},{"book":"ISA","chapter":45,"verse":3},{"book":"ROM","chapter":8,"verse":32}]'),
  (new_word_id, owner_id, 6,
   'The Scope of Faith & Vision',
   'As far as my eye can see — if I can imagine it, He can produce it.',
   '"If you can imagine it, I can produce it, says the Lord." Stay on the wall and ignore the naysayers who do not understand your assignment.',
   '[{"book":"GEN","chapter":13,"verse":15},{"book":"EPH","chapter":3,"verse":20},{"book":"HEB","chapter":11,"verse":11},{"book":"NEH","chapter":6,"verse":3}]');
end;
$$;
