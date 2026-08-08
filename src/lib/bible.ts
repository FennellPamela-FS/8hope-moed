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
