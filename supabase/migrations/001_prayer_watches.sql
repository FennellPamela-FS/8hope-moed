-- 8Hope: Prayer Watches table
-- Stores the 8 biblical prayer watch definitions

create table if not exists prayer_watches (
  id              uuid primary key default gen_random_uuid(),
  watch_key       text unique not null,   -- 'watch_1' through 'watch_8'
  watch_number    int not null,
  label           text not null,          -- 'First Watch'
  time_label      text not null,          -- '3:00 PM – 6:00 PM'
  start_hour      int not null,           -- 24h format (15 = 3pm)
  end_hour        int not null,           -- 24h format (18 = 6pm)
  focus           text not null,          -- 'Transition & Preparation'
  description     text not null,
  scripture_ref   text not null,
  scripture_text  text not null,
  meditation_prompt text not null,
  color           text not null,          -- Tailwind class or hex
  created_at      timestamptz default now()
);

-- Seed the 8 watches
-- Day begins at 3pm (evening) per Genesis 1 "evening and morning was the first day"
insert into prayer_watches
  (watch_key, watch_number, label, time_label, start_hour, end_hour, focus, description, scripture_ref, scripture_text, meditation_prompt, color)
values
  ('watch_1', 1, 'First Watch',   '3:00 PM – 6:00 PM',  15, 18,
   'Transition & Preparation',
   'The day begins. As afternoon shifts to evening, this is a time to release the burdens of the day and prepare your heart for intentional prayer.',
   'Psalm 55:17', '"Evening, and morning, and at noon, will I pray, and cry aloud: and he shall hear my voice."',
   'What am I releasing from today? What am I preparing my heart to receive?',
   '#C9A84C'),

  ('watch_2', 2, 'Second Watch',  '6:00 PM – 9:00 PM',  18, 21,
   'Gratitude & Reflection',
   'The evening settles. A time for gratitude, family, and reflecting on the day's evidence of God''s faithfulness.',
   'Lamentations 2:19', '"Arise, cry out in the night: in the beginning of the watches pour out thine heart like water before the face of the Lord."',
   'What evidence of God''s faithfulness did I witness today? Where did He show up?',
   '#1E3A5F'),

  ('watch_3', 3, 'Third Watch',   '9:00 PM – 12:00 AM', 21, 0,
   'Intercession & Surrender',
   'The world quiets. A powerful time to intercede for others and surrender outcomes you cannot control.',
   'Luke 12:38', '"And if he shall come in the second watch, or come in the third watch, and find them so, blessed are those servants."',
   'Who am I interceding for tonight? What am I surrendering to God?',
   '#2D6A4F'),

  ('watch_4', 4, 'Fourth Watch',  '12:00 AM – 3:00 AM', 0,  3,
   'Breakthrough & Spiritual Warfare',
   'Midnight. The deepest watch. A time of intense spiritual warfare and miraculous breakthrough. Paul and Silas prayed at midnight and chains broke.',
   'Acts 16:25', '"And at midnight Paul and Silas prayed, and sang praises unto God: and the prisoners heard them."',
   'What chains need to break in my life or someone I love? Pray with bold expectation.',
   '#0F1C2E'),

  ('watch_5', 5, 'Fifth Watch',   '3:00 AM – 6:00 AM',  3,  6,
   'Divine Encounter & Fresh Fire',
   'The pre-dawn hour. Many report waking at this hour drawn to pray. This is the watch of divine encounter — a thin place between heaven and earth.',
   'Mark 1:35', '"And in the morning, rising up a great while before day, he went out, and departed into a solitary place, and there prayed."',
   'What is God saying in this quiet hour? Listen before speaking. Record what you hear.',
   '#C9A84C'),

  ('watch_6', 6, 'Sixth Watch',   '6:00 AM – 9:00 AM',  6,  9,
   'Declaration & New Mercies',
   'Morning arrives with new mercies. A time to declare God''s Word over your day, your household, and your purpose.',
   'Lamentations 3:22-23', '"It is of the LORD''s mercies that we are not consumed, because his compassions fail not. They are new every morning."',
   'What declarations will I speak over today? What new mercy am I standing in?',
   '#1E3A5F'),

  ('watch_7', 7, 'Seventh Watch', '9:00 AM – 12:00 PM', 9,  12,
   'Assignment & Kingdom Work',
   'The work of the day begins. Invite God into your assignments. Pray for wisdom, favor, and divine connections in your work.',
   'Matthew 20:3', '"And he went out about the third hour, and saw others standing idle in the marketplace."',
   'What is my kingdom assignment today? Where do I need God''s wisdom and favor right now?',
   '#2D6A4F'),

  ('watch_8', 8, 'Eighth Watch',  '12:00 PM – 3:00 PM', 12, 15,
   'Perseverance & Midday Strength',
   'The midday hour. The sun is at its peak — and so can be the pressures of the day. A time to renew your strength and press through.',
   'Isaiah 40:31', '"But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles."',
   'Where do I need renewed strength right now? What is testing my perseverance today?',
   '#4A4A4A');
