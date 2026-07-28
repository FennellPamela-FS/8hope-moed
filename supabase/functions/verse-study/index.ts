import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { verseRef, verseText, hebrewDate } = await req.json()

    const prompt = `
You are a biblical scholar specializing in Hebrew and Greek scripture study for spiritual devotion.

Today's Hebrew date is: ${hebrewDate}

Verse: ${verseRef}
Text: "${verseText}"

Provide a deep spiritual study in this exact JSON format (no markdown, pure JSON):
{
  "hebrew_greek_word": "the most significant word in this verse",
  "original_language": "Hebrew" or "Greek",
  "transliteration": "phonetic pronunciation",
  "meaning": "the deep original meaning of this word (2-3 sentences)",
  "todays_revelation": "how this word and verse speaks specifically to this moment in the Hebrew calendar (3-4 sentences, personal and present-tense)",
  "prayer_prompt": "a 1-sentence prayer invitation based on this revelation"
}
`

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    })

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    const study = JSON.parse(text.trim())

    return new Response(
      JSON.stringify({ ...study, verse_ref: verseRef, verse_text: verseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate study', detail: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
