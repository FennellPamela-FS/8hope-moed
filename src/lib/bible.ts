import type { BibleVersion, BibleVerse } from '@/types'

const API_KEY = import.meta.env.VITE_BIBLE_API_KEY
const BASE_URL = 'https://api.scripture.api.bible/v1'

// API.Bible translation IDs for supported versions
const VERSION_IDS: Record<BibleVersion, string> = {
  KJV:  'de4e12af7f28f599-02',
  NIV:  '78a9f6124f344018-01',
  NLT:  '65eec8e0b60e656b-01',
  ESV:  '9879dbb7cfe39e4d-01',
  NKJV: '3e7b4c6e3e7b4c6e-01', // placeholder — update with real ID
  AMP:  'bf654c4bc3c9503f-01', // placeholder
  MSG:  '65eec8e0b60e656b-02', // placeholder
}

/**
 * Fetches a single Bible verse from API.Bible.
 */
export async function fetchVerse(
  book: string,
  chapter: number,
  verse: number,
  version: BibleVersion = 'KJV'
): Promise<BibleVerse> {
  const bibleId = VERSION_IDS[version]
  const verseId = `${book}.${chapter}.${verse}`
  const url = `${BASE_URL}/bibles/${bibleId}/verses/${verseId}?content-type=text&include-notes=false&include-titles=false`

  const res = await fetch(url, {
    headers: { 'api-key': API_KEY },
  })

  if (!res.ok) {
    throw new Error(`Bible API error ${res.status} for ${verseId}`)
  }

  const data = await res.json()
  const verseData = data.data

  return {
    ref: `${verseData.reference}`,
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
 * Fetches the Verse of the Day from API.Bible.
 */
export async function fetchVerseOfTheDay(version: BibleVersion = 'KJV'): Promise<BibleVerse> {
  const bibleId = VERSION_IDS[version]
  const url = `${BASE_URL}/bibles/${bibleId}/verses/votd`

  const res = await fetch(url, {
    headers: { 'api-key': API_KEY },
  })

  if (!res.ok) {
    // Fallback: return John 3:16
    return fetchVerse('JHN', 3, 16, version)
  }

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

export const BIBLE_VERSIONS: BibleVersion[] = ['KJV', 'NIV', 'NLT', 'ESV', 'NKJV', 'AMP', 'MSG']

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
