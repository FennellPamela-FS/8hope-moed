import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logAiUsage } from '../_shared/usage.ts'

/**
 * My Bible Study — "Ask for insight".
 *
 * POST { entry_id, question? } with the user's auth header. Reads the entry
 * through the caller's own session (RLS: owner + Bible Study member), grounds
 * the answer in the KJV text of the passage, and returns two perspectives
 * from the user's own study pattern: The Eagle (theological vision) and The
 * Lion (practical application — "We do not separate the Apostle from the
 * CEO"). Saved to study_insights.
 *
 * Guardrails (same as AI-written Prayer Watch content): derive from the
 * passage and Scripture itself; nothing mystical or made up; never force a
 * connection; "manifestation" only in its scriptural sense; never speak as God.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = 'gemini-3.6-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
const BIBLE_BASE = 'https://api.scripture.api.bible/v1'
const KJV_ID = 'de4e12af7f28f599-02'
const MAX_NOTES_CHARS = 6000

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function fetchPassage(passageId: string, apiKey: string): Promise<{ reference: string; text: string } | null> {
  try {
    const res = await fetch(`${BIBLE_BASE}/bibles/${KJV_ID}/passages/${passageId}?content-type=text&include-notes=false&include-titles=false&include-verse-numbers=true`, {
      headers: { 'api-key': apiKey },
    })
    if (!res.ok) return null
    const data = (await res.json()).data
    return { reference: data.reference, text: String(data.content).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() }
  } catch {
    return null
  }
}

interface Entry {
  book: string
  start_chapter: number
  start_verse: number
  end_chapter: number
  end_verse: number
  scribe: string | null
  pray: string | null
  ingest: string | null
  lead: string | null
  notes: string | null
  plan_id: string
}

function buildPrompt(passage: { reference: string; text: string }, entry: Entry, lens: { name: string | null; focus: string | null }, question: string | null): string {
  const notes = [
    entry.scribe && `Scribe notes: ${entry.scribe}`,
    entry.ingest && `Core truth so far: ${entry.ingest}`,
    entry.lead && `Leadership application so far: ${entry.lead}`,
    entry.notes && `Other notes: ${entry.notes}`,
  ].filter(Boolean).join('\n').slice(0, MAX_NOTES_CHARS)

  return `You are a Bible study companion for a Christian apostle and business leader who studies the Gospels in a pattern she calls "The Sovereign Study." She reads in two lenses — The Eagle (theological vision: Humanity, Detail, Systems, Healing) and The Lion (practical execution: Authority, Action, Speed). Her rule: "We do not separate the Apostle from the CEO" — faith applies in ministry, leadership, team, and business alike.

${lens.name ? `This book is read through ${lens.name}${lens.focus ? ` (${lens.focus})` : ''}.` : ''}

GUARDRAILS (non-negotiable):
- Derive everything from the passage and the 66 books of Scripture. Cite other Scripture by reference only when it genuinely connects.
- Nothing mystical, nothing made up, no invented etymology. If a connection is not genuinely there, do not force it — say less instead.
- Use "manifestation" only in its scriptural sense, never the modern law-of-attraction sense.
- Never speak as God or present anything as a personal prophetic word. Teach and apply.
- Respect her notes: build on her observations; do not correct her voice.

THE PASSAGE (KJV for reference; she reads the MEV): ${passage.reference}
${passage.text}

${notes ? `HER NOTES:\n${notes}\n` : ''}${question ? `HER QUESTION: ${question}\n` : ''}
Write:
- "eagle": 120–220 words. The theological vision — context, key original-language words where they truly matter, and how the passage connects to the wider story of Scripture.${question ? ' Answer her question here first.' : ''}
- "lion": 80–160 words. The practical execution — what to do with this in her own walk and in leading her team, ministry, or company.

Return ONLY JSON, no markdown:
{"eagle":"...","lion":"..."}`
}

async function generate(prompt: string, apiKey: string, userId: string): Promise<{ eagle: string; lion: string } | null> {
  let lowThinking = true
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 16384,
            responseMimeType: 'application/json',
            ...(lowThinking ? { thinkingConfig: { thinkingLevel: 'low' } } : {}),
          },
        }),
      })
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 500)
        console.error('gemini error', res.status, detail)
        if (res.status === 400 && lowThinking && /thinking/i.test(detail)) lowThinking = false
        continue
      }
      const data = await res.json()
      await logAiUsage({ feature: 'study-insight', model: MODEL, userId, usage: data.usageMetadata, ok: data.candidates?.[0]?.finishReason === 'STOP' })
      const raw = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim())
      if (typeof parsed?.eagle === 'string' && parsed.eagle.length >= 200 && typeof parsed?.lion === 'string' && parsed.lion.length >= 120) {
        return { eagle: parsed.eagle.trim(), lion: parsed.lion.trim() }
      }
      console.error('insight failed validation', raw.slice(0, 500))
    } catch (err) {
      console.error('insight attempt failed', err)
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
  const entryId = typeof body.entry_id === 'string' ? body.entry_id : ''
  const question = typeof body.question === 'string' && body.question.trim() ? body.question.trim().slice(0, 1000) : null
  if (!entryId) return jsonResponse({ error: 'missing_entry_id' }, 400)

  // RLS: only the caller's own entry, and only for Bible Study members.
  const { data: entry } = await supabase
    .from('study_entries')
    .select('book, start_chapter, start_verse, end_chapter, end_verse, scribe, pray, ingest, lead, notes, plan_id')
    .eq('id', entryId)
    .maybeSingle()
  if (!entry) return jsonResponse({ error: 'not_found' }, 404)
  const e = entry as Entry

  const { data: lensRow } = await supabase
    .from('study_plan_books')
    .select('lens_name, lens_focus')
    .eq('plan_id', e.plan_id)
    .eq('book', e.book)
    .maybeSingle()

  const passageId = `${e.book}.${e.start_chapter}.${e.start_verse}-${e.book}.${e.end_chapter}.${e.end_verse}`
  const passage = await fetchPassage(passageId, Deno.env.get('BIBLE_API_KEY') ?? '')
  if (!passage) return jsonResponse({ error: 'scripture_unavailable' }, 502)

  const insight = await generate(
    buildPrompt(passage, e, { name: lensRow?.lens_name ?? null, focus: lensRow?.lens_focus ?? null }, question),
    Deno.env.get('GEMINI_API_KEY') ?? '',
    user.id,
  )
  if (!insight) return jsonResponse({ error: 'generation_failed' }, 502)

  const { data: saved, error } = await supabase
    .from('study_insights')
    .insert({ entry_id: entryId, user_id: user.id, question, eagle: insight.eagle, lion: insight.lion, model: MODEL })
    .select()
    .single()
  if (error || !saved) {
    console.error('insight save failed', error)
    return jsonResponse({ error: 'save_failed' }, 500)
  }
  return jsonResponse({ insight: saved })
})
