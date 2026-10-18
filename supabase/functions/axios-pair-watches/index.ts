import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * AXIOS "Pair with watches".
 *
 * POST { word_id } with the user's auth header. Suggests which of the 8
 * prayer watches each of the word's anchors belongs to, by meaning — the
 * watch's focus and Scripture against the anchor. Returns suggestions
 * WITHOUT saving; the user approves or changes them in the app.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = 'gemini-3.6-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

// Mirrors src/lib/watches.ts.
const WATCHES = [
  { key: 'watch_1', label: 'First Watch (3–6 PM)', focus: 'Transition & Preparation', note: 'Release the burdens of the day and prepare the heart for intentional prayer.', scripture: 'Psalm 55:17' },
  { key: 'watch_2', label: 'Second Watch (6–9 PM)', focus: 'Gratitude & Reflection', note: "Gratitude and reflecting on the day's evidence of God's faithfulness.", scripture: 'Lamentations 2:19' },
  { key: 'watch_3', label: 'Third Watch (9 PM–12 AM)', focus: 'Intercession & Surrender', note: 'Intercede for others and surrender outcomes you cannot control.', scripture: 'Luke 12:38' },
  { key: 'watch_4', label: 'Fourth Watch (12–3 AM)', focus: 'Breakthrough & Spiritual Warfare', note: 'Midnight, the deepest watch: spiritual warfare and breakthrough.', scripture: 'Acts 16:25' },
  { key: 'watch_5', label: 'Fifth Watch (3–6 AM)', focus: 'Divine Encounter & Fresh Fire', note: 'The pre-dawn hour of encounter; listen before speaking.', scripture: 'Mark 1:35' },
  { key: 'watch_6', label: 'Sixth Watch (6–9 AM)', focus: 'Declaration & New Mercies', note: "Morning: declare God's promises over the day; new mercies.", scripture: 'Lamentations 3:22-23' },
  { key: 'watch_7', label: 'Seventh Watch (9 AM–12 PM)', focus: 'Assignment & Kingdom Work', note: 'Invite God into the day\'s assignments: wisdom, favor, divine connections.', scripture: 'Matthew 20:3' },
  { key: 'watch_8', label: 'Eighth Watch (12–3 PM)', focus: 'Perseverance & Midday Strength', note: 'Midday pressure: renew strength and press through.', scripture: 'Isaiah 40:31' },
]
const WATCH_KEYS = WATCHES.map((w) => w.key)

interface AnchorRow { id: string; title: string; phrase: string; explanation: string | null }
interface Pairing { anchor_id: string; watches: Array<{ watch_key: string; reason: string }> }

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function buildPrompt(anchors: AnchorRow[], relation: string, givenTo: string | null): string {
  const watchLines = WATCHES.map((w) => `${w.key}: ${w.label} — ${w.focus}. ${w.note} (${w.scripture})`).join('\n')
  const anchorLines = anchors.map((a) => `${a.id}: ${a.title} — "${a.phrase}"${a.explanation ? ` — ${a.explanation}` : ''}`).join('\n')
  const framing = relation === 'given'
    ? `These anchors come from a prophetic word the user delivered to ${givenTo || 'someone else'}; the user prays over them for that person. Pair each anchor with the watch where praying it over ${givenTo || 'them'} fits best.`
    : 'These anchors come from a prophetic word spoken over the user. Pair each anchor with the watch where praying and walking it out fits best.'

  return `You help a believer pair the anchors of a prophetic word with the 8 prayer watches in AXIOS, a Christian devotional app.

${framing}

Match by genuine meaning: the anchor's substance against the watch's focus and Scripture. Give each anchor its single best watch; add a second only when it fits just as genuinely. Never force a fit. Each "reason" is one short sentence naming the connection.

THE 8 WATCHES:
${watchLines}

THE ANCHORS (id: title — line — meaning):
${anchorLines}

Return ONLY JSON, no markdown:
{"pairings":[{"anchor_id":"<id>","watches":[{"watch_key":"watch_3","reason":"..."}]}]}
with one entry per anchor.`
}

async function suggest(prompt: string, apiKey: string): Promise<Pairing[] | null> {
  let lowThinking = true
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
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
      console.log('gemini usage', JSON.stringify({ fn: 'axios-pair-watches', finish: data.candidates?.[0]?.finishReason, ...data.usageMetadata }))
      const raw = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim())
      if (Array.isArray(parsed?.pairings)) return parsed.pairings as Pairing[]
      console.error('pairings failed validation', raw.slice(0, 500))
    } catch (err) {
      console.error('pairing attempt failed', err)
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

  // RLS: only the caller's own word, and only for AXIOS members.
  const [{ data: word }, { data: anchorRows }] = await Promise.all([
    supabase.from('axios_words').select('relation, given_to').eq('id', wordId).maybeSingle(),
    supabase.from('axios_anchors').select('id, title, phrase, explanation').eq('word_id', wordId).order('position'),
  ])
  if (!word) return jsonResponse({ error: 'not_found' }, 404)
  const anchors = (anchorRows ?? []) as AnchorRow[]
  if (anchors.length === 0) return jsonResponse({ error: 'no_anchors' }, 400)

  const pairings = await suggest(buildPrompt(anchors, word.relation, word.given_to), Deno.env.get('GEMINI_API_KEY') ?? '')
  if (!pairings) return jsonResponse({ error: 'generation_failed' }, 502)

  // Keep only real anchors of this word and real watch keys; at most 2 per anchor.
  const anchorIds = new Set(anchors.map((a) => a.id))
  const cleaned = pairings
    .filter((p) => anchorIds.has(p.anchor_id) && Array.isArray(p.watches))
    .map((p) => ({
      anchor_id: p.anchor_id,
      watches: p.watches
        .filter((w) => WATCH_KEYS.includes(w?.watch_key))
        .slice(0, 2)
        .map((w) => ({ watch_key: w.watch_key, reason: String(w.reason ?? '').trim() })),
    }))

  return jsonResponse({ pairings: cleaned })
})
