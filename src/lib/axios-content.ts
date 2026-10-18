import type { VerseRef } from '@/types'

// ─── Foundation ──────────────────────────────────────────────────────────────
// Romans 8 is the base of AXIOS; these verses anchor it.

export const AXIOS_FOUNDATION: Array<VerseRef & { label: string }> = [
  { book: 'ROM', chapter: 8, verse: 18, label: 'Foundational Verse' },
  { book: 'EPH', chapter: 4, verse: 1,  label: 'Our Anchor' },
  { book: 'GAL', chapter: 2, verse: 20, label: 'Our Anchor' },
]

export const AXIOS_BASE_CHAPTER = { book: 'ROM', chapter: 8 }

// ─── The AXIOS Equation ──────────────────────────────────────────────────────

export const AXIOS_EQUATION_PARTS: Array<{ symbol: string; name: string; meaning: string }> = [
  {
    symbol: 'AXIOS',
    name: 'Worthiness / Weight of the Call',
    meaning: 'From the Greek axios — "worthy" or "of equal weight." The divine weight, spiritual mandate, and authority assigned to your office.',
  },
  {
    symbol: 'Hs',
    name: 'Holy Spirit',
    meaning: 'The overarching multiplier and catalyst. All spiritual implementation relies on yielding to the Holy Spirit rather than relying on human strength.',
  },
  {
    symbol: 'S ≡ L',
    name: 'Call Equivalence to Walk',
    meaning: 'S is your Spiritual Call / Spoken Word; L is your Life — walk, character, daily habits. The triple bar means strict congruence: your daily character, governance, and lifestyle must equal and sustain the weight of the word spoken over you.',
  },
  {
    symbol: '→ G_T',
    name: 'Kingdom Treasury / Divine Manifestation',
    meaning: 'When your walk matches your call under the power of the Holy Spirit, it produces G_T — the opening of the Kingdom Treasury, divine expansion, and tangible manifestation of God\'s glory.',
  },
]

// ─── Memorize-mode spacing (Leitner boxes) ───────────────────────────────────
// Days until a card comes back after landing in each box.

const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14]

export function nextReview(box: number, knewIt: boolean): { review_box: number; next_review_on: string } {
  const review_box = knewIt ? Math.min(box + 1, 4) : 0
  return { review_box, next_review_on: localDateString(addDays(new Date(), REVIEW_INTERVAL_DAYS[review_box])) }
}

// ─── Dates ───────────────────────────────────────────────────────────────────
// Local-calendar YYYY-MM-DD — a check-in made at 9pm belongs to today, not
// to tomorrow's UTC date.

export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

// ─── Book names (all 66) ─────────────────────────────────────────────────────

export const BOOK_NAMES: Record<string, string> = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy',
  JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles',
  EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs',
  ECC: 'Ecclesiastes', SNG: 'Song of Solomon', ISA: 'Isaiah', JER: 'Jeremiah',
  LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea', JOL: 'Joel',
  AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk',
  ZEP: 'Zephaniah', HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi',
  MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts', ROM: 'Romans',
  '1CO': '1 Corinthians', '2CO': '2 Corinthians', GAL: 'Galatians', EPH: 'Ephesians',
  PHP: 'Philippians', COL: 'Colossians', '1TH': '1 Thessalonians', '2TH': '2 Thessalonians',
  '1TI': '1 Timothy', '2TI': '2 Timothy', TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews',
  JAS: 'James', '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John',
  '3JN': '3 John', JUD: 'Jude', REV: 'Revelation',
}

const BOOK_ALIASES: Record<string, string> = {
  psalm: 'PSA', song: 'SNG', 'song of songs': 'SNG', 'songs': 'SNG', revelations: 'REV',
}

export function formatRef(ref: VerseRef): string {
  return `${BOOK_NAMES[ref.book] ?? ref.book} ${ref.chapter}:${ref.verse}`
}

/**
 * Parses "Romans 8:28", "rom 8:28", "1 Cor 13:4" into a VerseRef. Returns
 * null when the book isn't recognized or the numbers are missing.
 */
export function parseRef(input: string): VerseRef | null {
  const match = input.trim().match(/^(.+?)\s+(\d+)\s*:\s*(\d+)$/)
  if (!match) return null
  const name = match[1].toLowerCase().replace(/\.$/, '').replace(/\s+/g, ' ')
  const compact = name.replace(/\s/g, '')

  let book: string | undefined = BOOK_ALIASES[name]
  if (!book && BOOK_NAMES[compact.toUpperCase()]) book = compact.toUpperCase()
  if (!book) {
    book = Object.keys(BOOK_NAMES).find((code) => {
      const full = BOOK_NAMES[code].toLowerCase()
      return full === name || full.replace(/\s/g, '').startsWith(compact)
    })
  }
  if (!book) return null
  return { book, chapter: Number(match[2]), verse: Number(match[3]) }
}

// ─── Anchor rotation (Home AXIOS card) ───────────────────────────────────────

/**
 * Which anchor to show right now: moves one anchor per day and one per watch.
 * Someone who always looks at the same hour still sees every anchor in turn
 * (one new one each day); someone looking through the day sees a different
 * one each watch. Day count is continuous across years.
 */
export function rotatingAnchorIndex(count: number, watchNumber: number, now: Date = new Date()): number {
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayNumber = Math.round((localMidnight.getTime() - localMidnight.getTimezoneOffset() * 60_000) / 86_400_000)
  return (dayNumber + watchNumber - 1) % count
}
