import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logAiUsage } from '../_shared/usage.ts'

/**
 * Moed "Reflection" + "Deeper Word Study" — optional sections layered on top
 * of the day's existing Moed content (moed_daily_content), never replacing
 * it. Generated once per (month, day, language) and cached.
 *
 * POST { month, day, language } with the user's auth header. Until the
 * app_settings flag moed_extras_released is true, only Moed reviewers get
 * content (403 for everyone else).
 *
 * Follows Dr. Anita's Moed guardrails: the 66 books only, standard lexical
 * scholarship, no mysticism, nothing forced, and Reflection written as
 * teaching — never as "God is saying to you today". Cross-references are
 * returned as data and each one is checked against the KJV before saving.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
const BIBLE_BASE = 'https://api.scripture.api.bible/v1'
const KJV_ID = 'de4e12af7f28f599-02'

type Language = 'en' | 'es'
// Verse text for grounding, per language (same full-canon IDs as daily-verses).
const GROUNDING_BIBLE_ID: Record<Language, string> = { en: KJV_ID, es: '592420522e16049f-01' }

const USFM_BOOKS = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH',
  'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON',
  'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL',
  'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN',
  'JUD', 'REV',
]

interface VerseRef { book: string; chapter: number; verse: number }
interface CachedVerse {
  book_code: string
  book_name: string
  chapter: number
  verse: number
  original_language: string
  hebrew_greek_word: string
  transliteration: string
  meaning: string
}
interface Extra { reflection: string; deep_study: string; cross_refs: VerseRef[] }

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function fetchVerseText(bibleId: string, ref: VerseRef, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(`${BIBLE_BASE}/bibles/${bibleId}/verses/${ref.book}.${ref.chapter}.${ref.verse}?content-type=text&include-notes=false&include-titles=false&include-verse-numbers=false`, {
      headers: { 'api-key': apiKey },
    })
    if (!res.ok) return null
    const text = String((await res.json()).data?.content ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    return text.length >= 10 ? text : null
  } catch {
    return null
  }
}

function buildPrompt(verses: Array<CachedVerse & { text: string }>, language: Language): string {
  const lines = verses.map((v, i) =>
    `Verse ${i + 1}: ${v.book_name} ${v.chapter}:${v.verse} — "${v.text}"
  Key ${v.original_language} word already studied: ${v.hebrew_greek_word} (${v.transliteration}) — ${v.meaning}`,
  ).join('\n\n')

  const languageDirective = language === 'en' ? '' : `
- Write "reflection" and "deep_study" entirely in natural, neutral Spanish for a broad Latin American and international readership — written natively, not translated from English. Keep original-language words in their original script and standard transliteration.`

  return `You are a biblical scholar and teacher adding two optional sections to "The Moed Meditation," a daily Scripture app. The day's three verses and each verse's key Hebrew/Greek word have already been chosen and studied; you add depth to that existing study.

STRICT THEOLOGICAL CONSTRAINTS (non-negotiable):
- Ground everything strictly and exclusively in the 66 canonical books of the Protestant Bible. No Apocrypha, extra-biblical texts, New Age concepts, or secular spiritual frameworks. Nothing mystical; no numerology beyond what the text itself says.
- Stay with standard lexical scholarship (Strong's, BDB, Thayer's). No invented etymology. If something is uncertain, leave it out rather than force it.
- Never speak for God. Do not write "God is saying to you today" or present anything as a personal word from God. Write as a teacher explaining and applying Scripture.
- Do not alter or question the verse references or the key word already given.${languageDirective}

For EACH of the 3 verses below, in the same order, produce:
1. "reflection": 3–4 sentences applying this verse to everyday life — honest, warm, and practical, grounded in the verse's own meaning and context.
2. "deep_study": 4–6 sentences going deeper into the key Hebrew/Greek word already given: its range of meaning, how it is used elsewhere in Scripture, and how that usage illuminates this verse. Do NOT write chapter/verse references inside this text — put them in "cross_refs" instead.
3. "cross_refs": 1–3 other verses where this same Hebrew/Greek word is used meaningfully, as {"book": "<code>", "chapter": n, "verse": n}. Book codes: ${USFM_BOOKS.join(', ')}. Only include references you are confident contain this word.

${lines}

Respond with ONLY this JSON (no markdown fences, no commentary):
{"verses":[{"reflection":"...","deep_study":"...","cross_refs":[{"book":"ROM","chapter":8,"verse":18}]},{...},{...}]}`
}

function isValid(parsed: unknown): parsed is { verses: Extra[] } {
  if (!parsed || typeof parsed !== 'object') return false
  const verses = (parsed as { verses?: unknown }).verses
  if (!Array.isArray(verses) || verses.length !== 3) return false
  return verses.every((v: unknown) => {
    const e = v as Extra
    return typeof v === 'object' && v !== null &&
      typeof e.reflection === 'string' && e.reflection.length >= 80 &&
      typeof e.deep_study === 'string' && e.deep_study.length >= 120 &&
      Array.isArray(e.cross_refs)
  })
}

async function generate(prompt: string, apiKey: string, userId: string): Promise<{ verses: Extra[] } | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
            // Same as daily-verses: keep 2.5 Flash's thinking from eating the
            // output budget and truncating the JSON.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      })
      if (!res.ok) {
        console.error('gemini error', res.status, (await res.text()).slice(0, 500))
        continue
      }
      const data = await res.json()
      await logAiUsage({ feature: 'moed-extras', model: MODEL, userId, usage: data.usageMetadata, ok: data.candidates?.[0]?.finishReason === 'STOP' })
      const raw = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim())
      if (isValid(parsed)) return parsed
      console.error('extras failed validation', raw.slice(0, 500))
    } catch (err) {
      console.error('extras attempt failed', err)
    }
  }
  return null
}

/** Keeps only cross-references that exist in the KJV, at most 3. */
async function verifiedRefs(refs: VerseRef[], apiKey: string): Promise<VerseRef[]> {
  const candidates = refs
    .filter((r) => r && USFM_BOOKS.includes(String(r.book).toUpperCase()) && Number.isInteger(Number(r.chapter)) && Number.isInteger(Number(r.verse)))
    .map((r) => ({ book: String(r.book).toUpperCase(), chapter: Number(r.chapter), verse: Number(r.verse) }))
    .slice(0, 3)
  const texts = await Promise.all(candidates.map((r) => fetchVerseText(KJV_ID, r, apiKey)))
  return candidates.filter((_, i) => texts[i] !== null)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'unauthorized' }, 401)

  const asUser = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await asUser.auth.getUser()
  if (!user) return jsonResponse({ error: 'unauthorized' }, 401)

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  // Gate: released to everyone, or the caller is a Moed reviewer.
  const [{ data: setting }, { data: profile }] = await Promise.all([
    admin.from('app_settings').select('value').eq('key', 'moed_extras_released').maybeSingle(),
    admin.from('user_profiles').select('moed_reviewer').eq('id', user.id).maybeSingle(),
  ])
  const released = setting?.value === true
  if (!released && !profile?.moed_reviewer) return jsonResponse({ error: 'not_released' }, 403)

  const body = await req.json().catch(() => ({}))
  const month = Number(body.month)
  const day = Number(body.day)
  const language: Language = body.language === 'es' ? 'es' : 'en'
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
    return jsonResponse({ error: 'invalid_date' }, 400)
  }

  const cached = await admin.from('moed_daily_extras').select('extras').eq('month', month).eq('day', day).eq('language', language).maybeSingle()
  if (cached.data) return jsonResponse({ month, day, language, extras: cached.data.extras, released, source: 'cache' })

  // Builds on the day's existing Moed content; the Moed page always loads
  // that first, so it is normally already cached.
  const content = await admin.from('moed_daily_content').select('verses').eq('month', month).eq('day', day).eq('language', language).maybeSingle()
  const baseVerses = (content.data?.verses ?? []) as CachedVerse[]
  if (baseVerses.length !== 3) return jsonResponse({ error: 'no_content' }, 404)

  const BIBLE_API_KEY = Deno.env.get('BIBLE_API_KEY') ?? ''
  const texts = await Promise.all(baseVerses.map((v) =>
    fetchVerseText(GROUNDING_BIBLE_ID[language], { book: v.book_code, chapter: v.chapter, verse: v.verse }, BIBLE_API_KEY)))
  if (texts.some((t) => !t)) return jsonResponse({ error: 'scripture_unavailable' }, 502)

  const generated = await generate(
    buildPrompt(baseVerses.map((v, i) => ({ ...v, text: texts[i]! })), language),
    Deno.env.get('GEMINI_API_KEY') ?? '',
    user.id,
  )
  if (!generated) return jsonResponse({ error: 'generation_failed' }, 502)

  const extras = await Promise.all(generated.verses.map(async (e) => ({
    reflection: e.reflection.trim(),
    deep_study: e.deep_study.trim(),
    cross_refs: await verifiedRefs(e.cross_refs, BIBLE_API_KEY),
  })))

  const { error } = await admin.from('moed_daily_extras').insert({ month, day, language, extras, model: MODEL })
  // 23505 = a concurrent request cached it first; the content is equivalent.
  if (error && error.code !== '23505') console.error('extras cache write failed', error)

  return jsonResponse({ month, day, language, extras, released, source: 'generated' })
})
