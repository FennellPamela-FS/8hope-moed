import type { PrayerWatch, WatchName } from '@/types'

/**
 * The 8 biblical prayer watches.
 * Day begins at 3pm per Genesis 1 — "evening and morning was the first day."
 */
export const PRAYER_WATCHES: PrayerWatch[] = [
  {
    id: 'watch_1',
    watch_key: 'watch_1',
    watch_number: 1,
    label: 'First Watch',
    time_label: '3:00 PM – 6:00 PM',
    start_hour: 15,
    end_hour: 18,
    focus: 'Transition & Preparation',
    description: 'The day begins. As afternoon shifts to evening, release the burdens of the day and prepare your heart for intentional prayer.',
    scripture_ref: 'Psalm 55:17',
    scripture_text: '"Evening, and morning, and at noon, will I pray, and cry aloud: and he shall hear my voice."',
    meditation_prompt: 'What am I releasing from today? What am I preparing my heart to receive?',
    color: '#C9A84C',
  },
  {
    id: 'watch_2',
    watch_key: 'watch_2',
    watch_number: 2,
    label: 'Second Watch',
    time_label: '6:00 PM – 9:00 PM',
    start_hour: 18,
    end_hour: 21,
    focus: 'Gratitude & Reflection',
    description: 'The evening settles. A time for gratitude and reflecting on the day\'s evidence of God\'s faithfulness.',
    scripture_ref: 'Lamentations 2:19',
    scripture_text: '"Arise, cry out in the night: in the beginning of the watches pour out thine heart like water before the face of the Lord."',
    meditation_prompt: 'What evidence of God\'s faithfulness did I witness today?',
    color: '#1E3A5F',
  },
  {
    id: 'watch_3',
    watch_key: 'watch_3',
    watch_number: 3,
    label: 'Third Watch',
    time_label: '9:00 PM – 12:00 AM',
    start_hour: 21,
    end_hour: 0,
    focus: 'Intercession & Surrender',
    description: 'The world quiets. A powerful time to intercede for others and surrender outcomes you cannot control.',
    scripture_ref: 'Luke 12:38',
    scripture_text: '"And if he shall come in the second watch, or come in the third watch, and find them so, blessed are those servants."',
    meditation_prompt: 'Who am I interceding for tonight? What am I surrendering to God?',
    color: '#2D6A4F',
  },
  {
    id: 'watch_4',
    watch_key: 'watch_4',
    watch_number: 4,
    label: 'Fourth Watch',
    time_label: '12:00 AM – 3:00 AM',
    start_hour: 0,
    end_hour: 3,
    focus: 'Breakthrough & Spiritual Warfare',
    description: 'Midnight. The deepest watch. A time of intense spiritual warfare and miraculous breakthrough.',
    scripture_ref: 'Acts 16:25',
    scripture_text: '"And at midnight Paul and Silas prayed, and sang praises unto God: and the prisoners heard them."',
    meditation_prompt: 'What chains need to break in my life or someone I love?',
    color: '#0F1C2E',
  },
  {
    id: 'watch_5',
    watch_key: 'watch_5',
    watch_number: 5,
    label: 'Fifth Watch',
    time_label: '3:00 AM – 6:00 AM',
    start_hour: 3,
    end_hour: 6,
    focus: 'Divine Encounter & Fresh Fire',
    description: 'The pre-dawn hour. Many report waking at 3am drawn to pray. This is the watch of divine encounter.',
    scripture_ref: 'Mark 1:35',
    scripture_text: '"And in the morning, rising up a great while before day, he went out, and departed into a solitary place, and there prayed."',
    meditation_prompt: 'What is God saying in this quiet hour? Listen before speaking.',
    color: '#C9A84C',
  },
  {
    id: 'watch_6',
    watch_key: 'watch_6',
    watch_number: 6,
    label: 'Sixth Watch',
    time_label: '6:00 AM – 9:00 AM',
    start_hour: 6,
    end_hour: 9,
    focus: 'Declaration & New Mercies',
    description: 'Morning arrives with new mercies. Declare God\'s Word over your day, your household, and your purpose.',
    scripture_ref: 'Lamentations 3:22-23',
    scripture_text: '"It is of the LORD\'s mercies that we are not consumed... They are new every morning."',
    meditation_prompt: 'What declarations will I speak over today? What new mercy am I standing in?',
    color: '#1E3A5F',
  },
  {
    id: 'watch_7',
    watch_key: 'watch_7',
    watch_number: 7,
    label: 'Seventh Watch',
    time_label: '9:00 AM – 12:00 PM',
    start_hour: 9,
    end_hour: 12,
    focus: 'Assignment & Kingdom Work',
    description: 'The work of the day begins. Invite God into your assignments. Pray for wisdom, favor, and divine connections.',
    scripture_ref: 'Matthew 20:3',
    scripture_text: '"And he went out about the third hour, and saw others standing idle in the marketplace."',
    meditation_prompt: 'What is my kingdom assignment today? Where do I need God\'s wisdom and favor?',
    color: '#2D6A4F',
  },
  {
    id: 'watch_8',
    watch_key: 'watch_8',
    watch_number: 8,
    label: 'Eighth Watch',
    time_label: '12:00 PM – 3:00 PM',
    start_hour: 12,
    end_hour: 15,
    focus: 'Perseverance & Midday Strength',
    description: 'The midday hour. Pressures peak. A time to renew your strength and press through.',
    scripture_ref: 'Isaiah 40:31',
    scripture_text: '"But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles."',
    meditation_prompt: 'Where do I need renewed strength right now? What is testing my perseverance?',
    color: '#4A4A4A',
  },
]

/**
 * Returns the currently active prayer watch based on local time.
 */
export function getActiveWatch(): PrayerWatch {
  const hour = new Date().getHours()

  const active = PRAYER_WATCHES.find((w) => {
    if (w.start_hour < w.end_hour) {
      return hour >= w.start_hour && hour < w.end_hour
    }
    // Wraps midnight (watch_3: 21–0)
    return hour >= w.start_hour || hour < w.end_hour
  })

  // Fallback to watch_1 (should never happen)
  return active ?? PRAYER_WATCHES[0]
}

/**
 * Returns a watch by its key.
 */
export function getWatchByKey(key: WatchName): PrayerWatch | undefined {
  return PRAYER_WATCHES.find((w) => w.watch_key === key)
}
