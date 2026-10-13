-- 8Hope: AXIOS — words spoken over me vs. words I gave
-- A user can keep their own record of a word they delivered to someone
-- else (e.g. Pamela's copy of "You Are The Bank", given to Dr. Anita).
-- The AI features write those from the giver's side — reminders and
-- intercession for the recipient — instead of first-person declarations.

alter table axios_words add column if not exists relation text not null default 'over_me'
  check (relation in ('over_me', 'given'));
alter table axios_words add column if not exists given_to text;

-- Which relation a guide was written for, so switching a word between
-- "over me" and "given" offers a refreshed guide.
alter table axios_guides add column if not exists relation text not null default 'over_me';
