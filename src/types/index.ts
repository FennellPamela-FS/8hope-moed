// ─── Prayer Watches ──────────────────────────────────────────────────────────

export type WatchName =
  | 'watch_1' | 'watch_2' | 'watch_3' | 'watch_4'
  | 'watch_5' | 'watch_6' | 'watch_7' | 'watch_8'

export interface PrayerWatch {
  id: string
  watch_key: WatchName
  watch_number: number        // 1–8
  label: string               // e.g. "First Watch"
  time_label: string          // e.g. "3:00 PM – 6:00 PM"
  start_hour: number          // 24h, e.g. 15
  end_hour: number            // 24h, e.g. 18
  focus: string               // e.g. "Transition & Preparation"
  description: string
  scripture_ref: string       // e.g. "Matthew 27:45"
  scripture_text: string
  meditation_prompt: string
  color: string               // Tailwind bg class
}

// ─── Verse Map ───────────────────────────────────────────────────────────────

export interface VerseRef {
  book: string     // e.g. 'PSA', 'PRO', 'JHN'
  chapter: number
  verse: number
}

export interface MoedVerseOption {
  slot: 1 | 2 | 3
  book_code: string
  book_name: string
  chapter: number
  verse: number
  testament: 'OT' | 'NT'
  original_language: 'Hebrew' | 'Greek'
  hebrew_greek_word: string
  transliteration: string
  meaning: string
  calendar_connection: string
  prayer_prompt: string
}

export interface MoedDailyContent {
  month: number
  day: number
  language: Language
  month_numerology: { theme: string; explanation: string }
  verses: MoedVerseOption[]   // exactly 3
  source: 'cache' | 'generated'
}

// ─── Language ────────────────────────────────────────────────────────────────
// Content-only: which language Bible verse text and Moed devotional content
// (word study, calendar connection, prayer prompt, month numerology) render
// in. Does NOT affect the app's own UI chrome (button labels, headers, nav),
// which stays English regardless — a deliberate, smaller scope than full
// interface localization.

export type Language = 'en' | 'es'

// ─── Bible ───────────────────────────────────────────────────────────────────

export type BibleVersion =
  | 'KJV' | 'ASV' | 'WEB' | 'LSV' | 'FBV' | 'MSG' | 'NASB' | 'AMP'  // en
  | 'RVR09' | 'PDD' | 'SBS' | 'VBL'                                 // es

export interface BibleVerse {
  ref: string            // e.g. "Psalm 7:28"
  book: string
  chapter: number
  verse: number
  text: string
  version: BibleVersion
}

// ─── Hebrew Date ─────────────────────────────────────────────────────────────

export interface HebrewDate {
  year: number           // e.g. 5786
  monthName: string      // e.g. "Tammuz"
  day: number
  formatted: string      // e.g. "3 Tammuz 5786"
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  display_name?: string
  divine_time_watch?: WatchName   // user's selected prayer watch
  bible_version: BibleVersion
  screensaver_image?: string
  notify_at_watch: boolean
  onboarding_complete: boolean
  created_at: string
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export interface FavoriteVerse {
  id: string
  user_id: string
  book: string
  chapter: number
  verse: number
  verse_text: string
  bible_version: BibleVersion
  notes?: string
  date_saved: string
}

// ─── Journal ─────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string
  user_id: string
  entry_date: string          // ISO date string 'YYYY-MM-DD'
  content: string
  watch_session?: WatchName
  verse_refs?: VerseRef[]
  created_at: string
  updated_at: string
}

// ─── Church License ──────────────────────────────────────────────────────────

export interface ChurchLicense {
  id: string
  church_name: string
  license_key: string
  branding: {
    app_name: string
    logo_url?: string
    primary_color: string
  }
  max_users: number
  active_until: string
  created_at: string
}
