-- 8Hope: Month numerology
-- Curated (NOT AI-generated) prophetic/biblical numerology copy per
-- Gregorian month number. Doctrinal content — hand-authored, not left to
-- an LLM to invent per generation. Static, 12 rows, never changes by year.
-- NOTE: this is a first draft (standard biblical-numerology teaching, the
-- tradition E.W. Bullinger's "Number in Scripture" codified). Flagged for
-- Dr. Anita's review before being treated as final/authoritative copy.

create table if not exists month_numerology (
  month       int primary key check (month between 1 and 12),
  theme       text not null,
  explanation text not null
);

comment on table month_numerology is
  'Curated (not AI-generated) prophetic/biblical numerology per Gregorian '
  'month. Doctrinal content — hand-authored, not left to an LLM to invent '
  'per generation. 12 rows, never changes by year. Draft copy pending '
  'Dr. Anita''s review.';

alter table month_numerology enable row level security;
-- Deny-all, same rationale as moed_daily_content: only the daily-verses
-- edge function (service_role) ever reads this table.

insert into month_numerology (month, theme, explanation) values
(1,  'Beginnings & Headship',
     'The number 1 speaks of unity and primacy — God as the sole source (Deut. 6:4). A month to seek fresh alignment under His headship before anything else is built.'),
(2,  'Witness & Division',
     'Two speaks of testimony and division — "at the mouth of two witnesses" (Deut. 19:15) a matter is established, while creation itself was divided on day two. A month for discerning true witnesses and right divisions.'),
(3,  'Completeness & Resurrection',
     'Three marks divine completeness — the Godhead, and Jonah''s three days prefiguring resurrection (Matt. 12:40). A month where what seemed buried may rise.'),
(4,  'Creation & the Material World',
     'Four is the number of the earth and material creation — four winds, four corners, day four''s sun/moon/stars (Gen. 1:14-19). A month to steward what has been physically entrusted.'),
(5,  'Grace',
     'Five is consistently the number of grace in Scripture — five-fold ministry, grace upon grace. A month marked by unearned favor rather than performance.'),
(6,  'Man & Weakness',
     'Six is the number of man, created on the sixth day, one short of seven''s perfection — a reminder of human limitation apart from God. A month to lean on strength beyond your own.'),
(7,  'Completion & Rest',
     'Seven is the number of divine completion and Sabbath rest — creation finished, the week sealed (Gen. 2:2-3). A month to recognize what God has already finished.'),
(8,  'New Beginnings',
     'Eight sits just past seven''s completion — the start of a new cycle, circumcision on the eighth day (Gen. 17:12), resurrection morning as the "eighth day." A month of new beginnings on the far side of what was completed.'),
(9,  'Fruitfulness & Finality',
     'Nine is linked to fruit — the Spirit''s nine-fold fruit (Gal. 5:22-23) and gestation reaching term. A month where what was planted comes to maturity.'),
(10, 'Testimony & Divine Order',
     'Ten speaks of law and complete testimony — the Ten Commandments, ten as a full round number of order (Ex. 20). A month for order under God''s revealed word.'),
(11, 'Disorder & Incompleteness',
     'Eleven falls short of twelve''s governmental completeness — often associated with disorder or a transitional, unsettled number in Scripture. A month to watch for what is still being sorted out before order arrives.'),
(12, 'Governmental Perfection',
     'Twelve is the number of divine government and apostolic foundation — twelve tribes, twelve apostles, the New Jerusalem''s twelve gates (Rev. 21:12-14). A month of governmental completeness and foundation-laying.');
