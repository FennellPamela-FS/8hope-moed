import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VerseStudy } from '@/types'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

/**
 * Generates a deep Hebrew/Greek study for a given Bible verse.
 * Returns structured revelation for The Moed Meditation.
 */
export async function studyVerse(
  verseRef: string,
  verseText: string,
  today: string  // Hebrew date string, e.g. "3 Tammuz 5786"
): Promise<VerseStudy> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `
You are a biblical scholar specializing in Hebrew and Greek scripture study for spiritual devotion.

Today's Hebrew date is: ${today}

Verse: ${verseRef}
Text: "${verseText}"

Provide a deep spiritual study in this exact JSON format (no markdown, pure JSON):
{
  "hebrew_greek_word": "the most significant word in this verse",
  "original_language": "Hebrew" or "Greek",
  "transliteration": "phonetic pronunciation",
  "meaning": "the deep original meaning of this word (2-3 sentences)",
  "todays_revelation": "how this word and verse speaks specifically to this moment in the Hebrew calendar — the season, the day, what God may be saying right now (3-4 sentences, personal and present-tense)",
  "prayer_prompt": "a 1-sentence prayer invitation based on this revelation"
}
`

  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()
  // Strip markdown code fences if present
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  const parsed = JSON.parse(text) as Omit<VerseStudy, 'verse_ref' | 'verse_text'>

  return {
    verse_ref: verseRef,
    verse_text: verseText,
    ...parsed,
  }
}
