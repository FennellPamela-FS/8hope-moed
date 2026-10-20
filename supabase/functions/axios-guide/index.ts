import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logAiUsage } from '../_shared/usage.ts'

/**
 * AXIOS 7-day meditation guide.
 *
 * POST { word_id } with the user's auth header. Returns the saved guide for
 * that word, generating it with Gemini only when none exists yet or the
 * word's anchors changed since it was generated. Every read and write goes
 * through the caller's own session, so RLS (owner-only, AXIOS members only)
 * applies exactly as it does in the app.
 *
 * Scripture text is fetched from scripture.api.bible (KJV) and handed to
 * Gemini to ground the guide — Gemini is told not to invent quotations.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = 'gemini-3.6-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
const BIBLE_BASE = 'https://api.scripture.api.bible/v1'
const KJV_ID = 'de4e12af7f28f599-02'

// Romans 8 is the base of AXIOS; these verses anchor it.
const FOUNDATION = [
  { ref: 'ROM.8.18', label: 'Foundational verse' },
  { ref: 'EPH.4.1', label: 'Anchor verse' },
  { ref: 'GAL.2.20', label: 'Anchor verse' },
]

const EQUATION = `AXIOS = Hs(S ≡ L) → G_T
- AXIOS: worthiness / the weight of the call (Greek axios, "worthy," "of equal weight").
- Hs: the Holy Spirit — the multiplier and catalyst; yielding to Him rather than human strength.
- S ≡ L: the Spiritual call / spoken word (S) must be strictly congruent with the Life — walk, character, daily habits (L).
- → G_T: when the walk matches the call under the Holy Spirit, it produces the opening of the Kingdom Treasury and the tangible manifestation of God's glory.`

interface VerseRef { book: string; chapter: number; verse: number }
interface Anchor {
  title: string
  phrase: string
  explanation: string | null
  verse_refs: VerseRef[]
  updated_at: string
}
interface GuideDay {
  day: number
  title: string
  anchors: string[]
  scriptures: string[]
  meditation: string
  declaration: string
  prayer: string
  action_step: string
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function fetchKjv(path: string, apiKey: string): Promise<{ reference: string; text: string } | null> {
  try {
    const res = await fetch(`${BIBLE_BASE}/bibles/${KJV_ID}/${path}?content-type=text&include-notes=false&include-titles=false`, {
      headers: { 'api-key': apiKey },
    })
    if (!res.ok) return null
    const data = (await res.json()).data
    return { reference: data.reference, text: String(data.content).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() }
  } catch {
    return null
  }
}

/** Who the guide is written for: the one the word was spoken over, or the one who gave it. */
interface Relation { relation: 'over_me' | 'given'; givenTo: string | null }

function buildPrompt(
  rel: Relation,
  wordTitle: string,
  wordText: string | null,
  application: string | null,
  anchors: Anchor[],
  romans8: string,
  foundation: string[],
  anchorScripture: Map<string, string>,
): string {
  const anchorLines = anchors.map((a, i) => {
    const verses = a.verse_refs
      .map((r) => anchorScripture.get(`${r.book}.${r.chapter}.${r.verse}`))
      .filter(Boolean)
      .join('\n    ')
    return `Anchor ${i + 1}: ${a.title}
  Line to memorize: "${a.phrase}"
  ${a.explanation ? `Meaning: ${a.explanation}\n  ` : ''}Scriptures:
    ${verses || '(none attached)'}`
  }).join('\n\n')

  const recipient = rel.givenTo || 'the person who received it'
  const framing = rel.relation === 'given'
    ? `You are writing a 7-day remembrance and intercession guide for AXIOS, a section of a Christian devotional app. This word was NOT spoken over the user — it is a prophetic word the user delivered to ${recipient}. The user keeps it to remember what the Lord said to ${recipient}, to pray over them, and to support them as they walk it out.

Write to the user in second person ("you"), and speak of ${recipient} in the third person. Never write as if the word were spoken over the user. Write warmly, with reverence and conviction.`
    : `You are writing a 7-day meditation and prayer guide for AXIOS, a section of a Christian devotional app where a believer meditates on a personal prophetic word spoken over them and walks it out.

Write warmly, in second person ("you"), with reverence and conviction.`

  const fieldGuide = rel.relation === 'given'
    ? `"meditation":"120–200 words on what the Lord said to ${recipient} through this anchor","declaration":"one sentence the user declares over ${recipient}, in the third person","prayer":"60–100 words of intercession for ${recipient}","action_step":"one concrete way to encourage, support, or pray for ${recipient} today"`
    : `"meditation":"120–200 words","declaration":"one first-person sentence to speak aloud","prayer":"60–100 words","action_step":"one concrete thing to do today"`

  return `${framing} Ground everything in the Scripture provided below. Quote Scripture only from the texts given here, word for word; you may cite other verses from the 66 books of the Bible by reference only. Never invent a quotation.

ROMANS 8 IS THE BASE of AXIOS. Draw on it throughout.

FOUNDATION:
${foundation.join('\n')}

THE AXIOS EQUATION:
${EQUATION}

THE WORD: "${wordTitle}"
${wordText ?? ''}
${application ? `\nHow they intend to walk it out:\n${application}` : ''}

THE ANCHORS:
${anchorLines}

ROMANS 8 (KJV):
${romans8}

STRUCTURE:
- Days 1–6: walk through the anchors in order. Every anchor must be the focus of at least one day; if there are more than 6 anchors, combine related ones; if fewer, give a weightier anchor two days or pair it with a Romans 8 theme.
- Day 7: bring the whole word together under the AXIOS equation — S ≡ L, the walk matching the call — and Romans 8:18.${rel.relation === 'given' ? ` Frame it as ${recipient}'s walk matching ${recipient}'s call, and the user standing with them.` : ''}
- Each day ties its anchor to a specific part of Romans 8.

Return ONLY JSON, no markdown, in exactly this shape:
{"days":[{"day":1,"title":"short title","anchors":["anchor title(s) this day covers"],"scriptures":["Romans 8:18","Nehemiah 2:8"],${fieldGuide}}]}
with exactly 7 days, numbered 1–7.`
}

function isValidGuide(parsed: unknown): parsed is { days: GuideDay[] } {
  if (!parsed || typeof parsed !== 'object') return false
  const days = (parsed as { days?: unknown }).days
  if (!Array.isArray(days) || days.length !== 7) return false
  return days.every((d: unknown, i) => {
    const day = d as GuideDay
    return (
      typeof d === 'object' && d !== null &&
      day.day === i + 1 &&
      typeof day.title === 'string' && day.title.length > 0 &&
      Array.isArray(day.anchors) &&
      Array.isArray(day.scriptures) &&
      typeof day.meditation === 'string' && day.meditation.length >= 200 &&
      typeof day.declaration === 'string' && day.declaration.length > 0 &&
      typeof day.prayer === 'string' && day.prayer.length >= 100 &&
      typeof day.action_step === 'string' && day.action_step.length > 0
    )
  })
}

async function generateGuide(prompt: string, apiKey: string, userId: string): Promise<{ days: GuideDay[] } | null> {
  let lowThinking = true
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
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
      await logAiUsage({ feature: 'axios-guide', model: MODEL, userId, usage: data.usageMetadata, ok: data.candidates?.[0]?.finishReason === 'STOP' })
      const raw = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      const parsed = JSON.parse(cleaned)
      if (isValidGuide(parsed)) return parsed
      console.error('guide failed validation', cleaned.slice(0, 500))
    } catch (err) {
      console.error('guide generation attempt failed', err)
    }
  }
  return null
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

  // RLS returns nothing unless this is the caller's own word and their
  // account has AXIOS enabled.
  const [{ data: word }, { data: anchorRows }, { data: existing }] = await Promise.all([
    supabase.from('axios_words').select('id, title, full_text, application, relation, given_to').eq('id', wordId).maybeSingle(),
    supabase.from('axios_anchors').select('title, phrase, explanation, verse_refs, updated_at').eq('word_id', wordId).order('position'),
    supabase.from('axios_guides').select('*').eq('word_id', wordId).maybeSingle(),
  ])
  if (!word) return jsonResponse({ error: 'not_found' }, 404)

  const anchors = (anchorRows ?? []) as Anchor[]
  if (anchors.length === 0) return jsonResponse({ error: 'no_anchors' }, 400)

  const stale = !existing ||
    existing.relation !== word.relation ||
    existing.anchor_count !== anchors.length ||
    anchors.some((a) => Date.parse(a.updated_at) > Date.parse(existing.generated_at))
  if (!stale) return jsonResponse({ guide: existing, source: 'cache' })

  const BIBLE_API_KEY = Deno.env.get('BIBLE_API_KEY') ?? ''
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''

  const anchorRefIds = [...new Set(anchors.flatMap((a) => a.verse_refs.map((r) => `${r.book}.${r.chapter}.${r.verse}`)))]
  const [romans8, foundationVerses, anchorVerses] = await Promise.all([
    fetchKjv('chapters/ROM.8', BIBLE_API_KEY),
    Promise.all(FOUNDATION.map((f) => fetchKjv(`verses/${f.ref}`, BIBLE_API_KEY))),
    Promise.all(anchorRefIds.map((id) => fetchKjv(`verses/${id}`, BIBLE_API_KEY))),
  ])
  if (!romans8) return jsonResponse({ error: 'scripture_unavailable' }, 502)

  const foundation = FOUNDATION.map((f, i) =>
    foundationVerses[i] ? `${f.label} — ${foundationVerses[i]!.reference}: "${foundationVerses[i]!.text}"` : '',
  ).filter(Boolean)
  const anchorScripture = new Map<string, string>()
  anchorRefIds.forEach((id, i) => {
    const v = anchorVerses[i]
    if (v) anchorScripture.set(id, `${v.reference}: "${v.text}"`)
  })

  const prompt = buildPrompt({ relation: word.relation, givenTo: word.given_to }, word.title, word.full_text, word.application, anchors, romans8.text, foundation, anchorScripture)
  const generated = await generateGuide(prompt, GEMINI_API_KEY, user.id)
  if (!generated) return jsonResponse({ error: 'generation_failed' }, 502)

  const { data: saved, error } = await supabase
    .from('axios_guides')
    .upsert({
      word_id: wordId,
      user_id: user.id,
      days: generated.days,
      anchor_count: anchors.length,
      relation: word.relation,
      model: MODEL,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'word_id' })
    .select()
    .single()
  if (error || !saved) {
    console.error('guide save failed', error)
    return jsonResponse({ error: 'save_failed' }, 500)
  }

  return jsonResponse({ guide: saved, source: 'generated' })
})
