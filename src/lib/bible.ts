import type { BibleVersion, BibleVerse } from '@/types'

const API_KEY = import.meta.env.VITE_BIBLE_API_KEY
const BASE_URL = 'https://api.scripture.api.bible/v1'

// ─── Known public-domain IDs (stable across accounts) ────────────────────────
// For copyrighted versions (NKJV, AMP, MSG), IDs are resolved at runtime
// from your account's available Bibles via resolveBibleIds().
const KNOWN_IDS: Partial<Record<BibleVersion, string>> = {
  KJV: 'de4e12af7f28f599-02',
  NIV: '78a9f6124f344018-01',
  NLT: '65eec8e0b60e656b-01',
  ESV: '9879dbb7cfe39e4d-01',
}

// Runtime-resolved IDs (populated on first call)
let resolvedIds: Partial<Record<BibleVersion, string>> = { ...KNOWN_IDS }
let resolved = false

// Name fragments used to match copyrighted versions in the /bibles list
const VERSION_NAME_HINTS: Partial<Record<BibleVersion, string>> = {
  NKJV: 'new king james',
  AMP:  'amplified',
  MSG:  'message',
}

/**
 * Fetches available Bibles from the API and resolves IDs for any
 * version not already known. Called once and cached.
 */
export async function resolveBibleIds(): Promise<void> {
  if (resolved) return
  resolved = true

  const missing = (Object.keys(VERSION_NAME_HINTS) as BibleVersion[]).filter(
    (v) => !resolvedIds[v]
  )
  if (missing.length === 0) return

  try {
    const res = await fetch(`${BASE_URL}/bibles?language=eng`, {
      headers: { 'api-key': API_KEY },
    })
    if (!res.ok) return

    const data = await res.json()
    const bibles: Array<{ id: string; name: string }> = data.data ?? []

    for (const version of missing) {
      const hint = VERSION_NAME_HINTS[version]?.toLowerCase()
      const match = bibles.find((b) => b.name.toLowerCase().includes(hint ?? ''))
      if (match) resolvedIds[version] = match.id
    }
  } catch {
    // Non-fatal — will fall back to KJV for unresolved versions
  }
}

function getBibleId(version: BibleVersion): string {
  return resolvedIds[version] ?? resolvedIds['KJV'] ?? 'de4e12af7f28f599-02'
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches a single Bible verse from API.Bible.
 */
export async function fetchVerse(
  book: string,
  chapter: number,
  verse: number,
  version: BibleVersion = 'KJV'
): Promise<BibleVerse> {
  await resolveBibleIds()

  const bibleId = getBibleId(version)
  const verseId = `${book}.${chapter}.${verse}`
  const url = `${BASE_URL}/bibles/${bibleId}/verses/${verseId}?content-type=text&include-notes=false&include-titles=false`

  const res = await fetch(url, { headers: { 'api-key': API_KEY } })

  if (!res.ok) {
    throw new Error(`Bible API error ${res.status} for ${verseId}`)
  }

  const data = await res.json()
  const verseData = data.data

  return {
    ref: verseData.reference,
    book,
    chapter,
    verse,
    text: verseData.content.replace(/<[^>]+>/g, '').trim(),
    version,
  }
}

/**
 * Fetches multiple verses in parallel.
 */
export async function fetchVerses(
  refs: Array<{ book: string; chapter: number; verse: number }>,
  version: BibleVersion = 'KJV'
): Promise<BibleVerse[]> {
  return Promise.all(refs.map((r) => fetchVerse(r.book, r.chapter, r.verse, version)))
}

/**
 * Fetches the Verse of the Day.
 */
export async function fetchVerseOfTheDay(version: BibleVersion = 'KJV'): Promise<BibleVerse> {
  await resolveBibleIds()

  const bibleId = getBibleId(version)
  const res = await fetch(`${BASE_URL}/bibles/${bibleId}/verses/votd`, {
    headers: { 'api-key': API_KEY },
  })

  if (!res.ok) return fetchVerse('JHN', 3, 16, version)

  const data = await res.json()
  const v = data.data

  return {
    ref: v.reference,
    book: v.bookId,
    chapter: parseInt(v.chapterId?.split('.')[1] ?? '1'),
    verse: parseInt(v.id?.split('.')[2] ?? '1'),
    text: v.content.replace(/<[^>]+>/g, '').trim(),
    version,
  }
}

// NIV and MSG hidden until API access is resolved in a future phase
export const BIBLE_VERSIONS: BibleVersion[] = ['KJV', 'NLT', 'ESV', 'NKJV', 'AMP']

// NT book by month (for Moed's third daily verse)
export const NT_BOOK_BY_MONTH: Record<number, string> = {
  1:  'MAT', // January  → Matthew
  2:  'MRK', // February → Mark
  3:  'LUK', // March    → Luke
  4:  'JHN', // April    → John
  5:  'ACT', // May      → Acts
  6:  'ROM', // June     → Romans
  7:  '1CO', // July     → 1 Corinthians
  8:  '2CO', // August   → 2 Corinthians
  9:  'GAL', // September→ Galatians
  10: 'EPH', // October  → Ephesians
  11: 'PHP', // November → Philippians
  12: 'COL', // December → Colossians
}

// ─── Safe M:D fallback (last resort, used only if the daily-verses edge ───
// ─── function is unreachable — e.g. a network/outage failure) ──────────────
// This does not attempt to replicate the edge function's AI-selected book
// variety — it's a simple, guaranteed-valid Psalms/Proverbs/monthly-NT-book
// reference so the page never breaks. Caps an out-of-range day-of-month (or,
// for Gal/Eph/Php/Col, an out-of-range month-as-chapter) so it never
// produces a reference that doesn't exist, e.g. Psalm 8:12.

const PSALM_MAX_BY_MONTH: Record<number, number> = {
  1: 6, 2: 12, 3: 8, 4: 8, 5: 12, 6: 10, 7: 17, 8: 9, 9: 20, 10: 18, 11: 7, 12: 8,
}

const PROVERBS_MAX_BY_MONTH: Record<number, number> = {
  1: 33, 2: 22, 3: 35, 4: 27, 5: 23, 6: 35, 7: 27, 8: 36, 9: 18, 10: 32, 11: 31, 12: 28,
}

// Chapter is normally `month`, but Gal/Eph have only 6 chapters and
// Php/Col have only 4 — capped here so Sep–Dec never point past the book's end.
const NT_MAX_BY_MONTH: Record<number, { chapter: number; verse: number }> = {
  1:  { chapter: 1, verse: 25 }, // Matthew 1
  2:  { chapter: 2, verse: 28 }, // Mark 2
  3:  { chapter: 3, verse: 38 }, // Luke 3
  4:  { chapter: 4, verse: 54 }, // John 4
  5:  { chapter: 5, verse: 42 }, // Acts 5
  6:  { chapter: 6, verse: 23 }, // Romans 6
  7:  { chapter: 7, verse: 40 }, // 1 Corinthians 7
  8:  { chapter: 8, verse: 24 }, // 2 Corinthians 8
  9:  { chapter: 6, verse: 18 }, // Galatians 6 (capped from month 9)
  10: { chapter: 6, verse: 24 }, // Ephesians 6 (capped from month 10)
  11: { chapter: 4, verse: 23 }, // Philippians 4 (capped from month 11)
  12: { chapter: 4, verse: 18 }, // Colossians 4 (capped from month 12)
}

function cap(value: number, max: number): number {
  return Math.min(value, max)
}

/**
 * Safe fallback refs for a given calendar month/day, used only when the
 * daily-verses edge function can't be reached. Always returns valid,
 * existing references.
 */
export function getSafeDailyRefs(month: number, day: number) {
  const psalmMax = PSALM_MAX_BY_MONTH[month] ?? 8
  const proverbMax = PROVERBS_MAX_BY_MONTH[month] ?? 18
  const nt = NT_MAX_BY_MONTH[month] ?? { chapter: 1, verse: 20 }

  return [
    { book: 'PSA', chapter: month, verse: cap(day, psalmMax) },
    { book: 'PRO', chapter: month, verse: cap(day, proverbMax) },
    { book: NT_BOOK_BY_MONTH[month] ?? 'JHN', chapter: nt.chapter, verse: cap(day, nt.verse) },
  ]
}
