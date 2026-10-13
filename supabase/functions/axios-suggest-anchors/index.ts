import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * AXIOS "Pull anchors from this word".
 *
 * POST { word_id } with the user's auth header. Reads the word (through the
 * caller's session, so RLS applies), asks Gemini to suggest anchors, and
 * returns them WITHOUT saving — the user reviews, edits, and keeps the ones
 * they want in the app. Every suggested verse is checked against the KJV on
 * scripture.api.bible; references that don't exist are dropped.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = 'gemini-3.6-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
const BIBLE_BASE = 'https://api.scripture.api.bible/v1'
const KJV_ID = 'de4e12af7f28f599-02'

// Long transcripts are trimmed to keep each request's cost bounded (~25k
// characters ≈ 6–7k tokens).
const MAX_WORD_CHARS = 25_000

const USFM_BOOKS = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH',
  'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON',
  'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL',
  'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN',
  'JUD', 'REV',
]

interface VerseRef { book: string; chapter: number; verse: number }
interface Suggestion {
  title: string
  phrase: string
  explanation: string
  verse_refs: VerseRef[]
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function buildPrompt(title: string, text: string, application: string | null, relation: string, givenTo: string | null): string {
  const recipient = givenTo || 'the person who received it'
  const framing = relation === 'given'
    ? `You help a believer turn a prophetic word THEY DELIVERED to ${recipient} into "anchors" for AXIOS, a Christian devotional app. The word was not spoken over the user; they keep it to remember what the Lord said to ${recipient}, to pray over them, and to support them. An anchor is one core point of the word that the user will remember and intercede over.`
    : `You help a believer turn a personal prophetic word spoken over them into "anchors" for AXIOS, a Christian devotional app. An anchor is one core point of the word that they will memorize, meditate on, and walk out.`
  const phraseRule = relation === 'given'
    ? `one line to remember about ${recipient}, in the third person (e.g. "${recipient} is called to build without bleeding."), under 20 words, drawn from the word. Never first person.`
    : `one first-person line to memorize, under 20 words, drawn from the word.`

  return `${framing} Romans 8 is the base of AXIOS (Romans 8:18 foundational; Ephesians 4:1 and Galatians 2:20 are anchor verses).

Read the word below and return 3 to 8 anchors — the distinct, central declarations, mandates, or identities it speaks. Keep the speaker's own language and terms. Do not merge unrelated points or invent points that are not in the word.

For each anchor:
- "title": a short name (2–6 words), e.g. "The Nehemiah Mandate".
- "phrase": ${phraseRule}
- "explanation": 1–3 sentences on what the word says about this point.
- "verse_refs": 1–3 Bible verses that genuinely support it — use a verse the word itself cites when there is one; otherwise choose from the 66 books. Use these book codes only: ${USFM_BOOKS.join(', ')}.

Return ONLY JSON, no markdown:
{"anchors":[{"title":"","phrase":"","explanation":"","verse_refs":[{"book":"NEH","chapter":2,"verse":8}]}]}

THE WORD: "${title}"
${text}
${application ? `\nHow they intend to walk it out:\n${application}` : ''}`
}

function isValid(parsed: unknown): parsed is { anchors: Suggestion[] } {
  if (!parsed || typeof parsed !== 'object') return false
  const anchors = (parsed as { anchors?: unknown }).anchors
  if (!Array.isArray(anchors) || anchors.length === 0) return false
  return anchors.every((a: unknown) => {
    const s = a as Suggestion
    return typeof a === 'object' && a !== null &&
      typeof s.title === 'string' && s.title.trim().length > 0 &&
      typeof s.phrase === 'string' && s.phrase.trim().length > 0 &&
      typeof s.explanation === 'string' &&
      Array.isArray(s.verse_refs)
  })
}

async function suggest(prompt: string, apiKey: string): Promise<Suggestion[] | null> {
  let lowThinking = true
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            // Thinking tokens share this budget (and bill as output); with
            // 8k they could crowd out the answer and truncate the JSON.
            maxOutputTokens: 32768,
            responseMimeType: 'application/json',
            ...(lowThinking ? { thinkingConfig: { thinkingLevel: 'low' } } : {}),
          },
        }),
      })
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 500)
        console.error('gemini error', res.status, detail)
        // Older/other models reject thinkingLevel — retry without it.
        if (res.status === 400 && lowThinking && /thinking/i.test(detail)) lowThinking = false
        continue
      }
      const data = await res.json()
      console.log('gemini usage', JSON.stringify({ finish: data.candidates?.[0]?.finishReason, ...data.usageMetadata }))
      const raw = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim())
      if (isValid(parsed)) return parsed.anchors.slice(0, 8)
      console.error('suggestions failed validation', raw.slice(0, 500))
    } catch (err) {
      console.error('suggestion attempt failed', err)
    }
  }
  return null
}

/** Keeps only references that exist in the KJV. */
async function verifiedRefs(refs: VerseRef[], apiKey: string): Promise<VerseRef[]> {
  const candidates = refs
    .filter((r) => r && USFM_BOOKS.includes(String(r.book).toUpperCase()) && Number.isInteger(Number(r.chapter)) && Number.isInteger(Number(r.verse)))
    .map((r) => ({ book: String(r.book).toUpperCase(), chapter: Number(r.chapter), verse: Number(r.verse) }))
    .slice(0, 3)
  const checks = await Promise.all(candidates.map(async (r) => {
    try {
      const res = await fetch(`${BIBLE_BASE}/bibles/${KJV_ID}/verses/${r.book}.${r.chapter}.${r.verse}?content-type=text`, {
        headers: { 'api-key': apiKey },
      })
      return res.ok
    } catch {
      return false
    }
  }))
  return candidates.filter((_, i) => checks[i])
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'unauthorized' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return jsonResponse({ error: 'unauthorized' }, 401)

  const body = await req.json().catch(() => ({}))
  const wordId = typeof body.word_id === 'string' ? body.word_id : ''
  if (!wordId) return jsonResponse({ error: 'missing_word_id' }, 400)

  // RLS: only the caller's own word, and only for AXIOS members.
  const { data: word } = await supabase
    .from('axios_words')
    .select('title, full_text, application, relation, given_to')
    .eq('id', wordId)
    .maybeSingle()
  if (!word) return jsonResponse({ error: 'not_found' }, 404)
  if (!word.full_text || word.full_text.trim().length < 40) return jsonResponse({ error: 'no_text' }, 400)

  const text = word.full_text.slice(0, MAX_WORD_CHARS)
  const suggestions = await suggest(buildPrompt(word.title, text, word.application, word.relation, word.given_to), Deno.env.get('GEMINI_API_KEY') ?? '')
  if (!suggestions) return jsonResponse({ error: 'generation_failed' }, 502)

  const BIBLE_API_KEY = Deno.env.get('BIBLE_API_KEY') ?? ''
  const anchors = await Promise.all(suggestions.map(async (s) => ({
    title: s.title.trim(),
    phrase: s.phrase.trim(),
    explanation: s.explanation.trim(),
    verse_refs: await verifiedRefs(s.verse_refs, BIBLE_API_KEY),
  })))

  return jsonResponse({ anchors, truncated: word.full_text.length > MAX_WORD_CHARS })
})
