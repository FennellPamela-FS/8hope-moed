import { BOOK_NAMES } from '@/lib/axios-content'
import { fetchChapterVerseCount } from '@/lib/bible'

// ─── My Bible Study helpers ──────────────────────────────────────────────────

/** "Mark 8:1–21" / "Luke 5:17–6:11" */
export function formatPassage(book: string, sc: number, sv: number, ec: number, ev: number): string {
  const name = BOOK_NAMES[book] ?? book
  if (sc === ec) return sv === ev ? `${name} ${sc}:${sv}` : `${name} ${sc}:${sv}–${ev}`
  return `${name} ${sc}:${sv}–${ec}:${ev}`
}

/**
 * Where the next reading starts after one that ended at endChapter:endVerse —
 * the next verse, or the next chapter's first verse when the chapter ended.
 * Falls back to the next verse if the verse count can't be fetched.
 */
export async function nextStart(book: string, endChapter: number, endVerse: number, totalChapters: number): Promise<{ chapter: number; verse: number }> {
  try {
    const count = await fetchChapterVerseCount(book, endChapter)
    if (endVerse >= count) {
      return endChapter < totalChapters ? { chapter: endChapter + 1, verse: 1 } : { chapter: endChapter, verse: endVerse }
    }
  } catch {
    // keep going with the next verse
  }
  return { chapter: endChapter, verse: endVerse + 1 }
}

/** The five steps of the Sovereign Study, with the user's own prompts. */
export const SOVEREIGN_STEPS = [
  {
    key: 'read_text',
    title: '1. Read',
    subtitle: 'The Ground',
    prompt: 'Paste the Scripture for the day, if you like.',
  },
  {
    key: 'scribe',
    title: '2. Scribe',
    subtitle: "The Eagle's Detail",
    prompt: 'Log prophetic insights. Find the "foreign man" or the "Tradition of the Elders." Connect the text to business parallels. Highlight words like "Immediately."',
  },
  {
    key: 'pray',
    title: '3. Pray',
    subtitle: 'The Seal',
    prompt: '"Abba…" Turn the revelation into a decree or a petition for your own spirit and the company.',
  },
  {
    key: 'ingest',
    title: '4. Ingest',
    subtitle: "The Lion's Digestion",
    prompt: 'In one or two sentences: the heavy meat of this passage to absorb today.',
  },
  {
    key: 'lead',
    title: '5. Lead',
    subtitle: 'The Executive Execution',
    prompt: 'What must I do with this? A team policy, a client boundary, a message for someone, a post for social media?',
  },
] as const

export type SovereignStepKey = (typeof SOVEREIGN_STEPS)[number]['key']

export const SOVEREIGN_RULE = 'We do not separate the "Apostle" from the "CEO." The mantle remains on in the boardroom.'

/** Lens badge colors: Lion = gold, Eagle = blue, anything else neutral. */
export function lensClass(lens: string | null): string {
  if (lens?.toLowerCase().includes('lion')) return 'bg-gold-500/15 text-gold-700'
  if (lens?.toLowerCase().includes('eagle')) return 'bg-hope-blue/10 text-hope-blue'
  return 'bg-gray-100 text-hope-gray'
}
