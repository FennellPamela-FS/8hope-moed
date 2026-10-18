-- 8Hope: pair AXIOS anchors with the 8 prayer watches
-- An anchor can belong to several watches. Pairings are suggested by the
-- axios-pair-watches edge function and only saved once the user approves
-- them (or set by hand). Shown on the Watches page inside each watch.

create table if not exists axios_anchor_watches (
  anchor_id   uuid not null references axios_anchors(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  watch_key   text not null check (watch_key in (
                'watch_1', 'watch_2', 'watch_3', 'watch_4',
                'watch_5', 'watch_6', 'watch_7', 'watch_8')),
  reason      text,   -- the AI's one-line rationale, when it suggested the pairing
  created_at  timestamptz not null default now(),
  primary key (anchor_id, watch_key)
);

create index if not exists axios_anchor_watches_user_watch_idx on axios_anchor_watches (user_id, watch_key);

alter table axios_anchor_watches enable row level security;

create policy "AXIOS members manage own anchor watches"
  on axios_anchor_watches for all
  using (auth.uid() = user_id and is_axios_member())
  with check (
    auth.uid() = user_id and is_axios_member()
    and exists (select 1 from axios_anchors a where a.id = anchor_id and a.user_id = auth.uid())
  );
