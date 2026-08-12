-- 8Hope: verse_map read policy
-- RLS was enabled on verse_map with no policies, which silently denies all
-- access (including SELECT) to anon/authenticated clients. This made the app
-- always fall back to its uncapped month:day guess, producing invalid refs
-- like Psalm 8:12 (Psalm 8 only has 9 verses) once the day-of-month exceeded
-- a chapter's real verse count.
--
-- verse_map is public reference data (no user data), so open read access is
-- safe. Writes stay restricted to service_role (no insert/update/delete
-- policy is defined here).

create policy "Anyone can read verse map"
  on verse_map for select
  using (true);
