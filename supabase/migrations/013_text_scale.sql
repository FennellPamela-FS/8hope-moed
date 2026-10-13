-- 8Hope: per-user text size
-- Percentage applied to all app text (layout spacing and icons stay put),
-- saved to the profile so it follows the user across devices. 200 is the
-- WCAG 1.4.4 "resize text to 200%" level.

alter table user_profiles add column if not exists text_scale int not null default 100
  check (text_scale in (90, 100, 115, 130, 150, 200));
