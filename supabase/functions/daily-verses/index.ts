import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NT book rotation by month
const NT_BOOK_BY_MONTH: Record<number, string> = {
  1: 'MAT', 2: 'MRK', 3: 'LUK', 4: 'JHN', 5: 'ACT', 6: 'ROM',
  7: '1CO', 8: '2CO', 9: 'GAL', 10: 'EPH', 11: 'PHP', 12: 'COL',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const url = new URL(req.url)
  const month = parseInt(url.searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const day = parseInt(url.searchParams.get('day') ?? String(new Date().getDate()))

  // Check verse_map table first
  const { data: mapEntry } = await supabase
    .from('verse_map')
    .select('*')
    .eq('month', month)
    .eq('day', day)
    .single()

  if (mapEntry) {
    return new Response(
      JSON.stringify({
        refs: [
          { book: mapEntry.book_1, chapter: mapEntry.chapter_1, verse: mapEntry.verse_1 },
          { book: mapEntry.book_2, chapter: mapEntry.chapter_2, verse: mapEntry.verse_2 },
          { book: mapEntry.book_3, chapter: mapEntry.chapter_3, verse: mapEntry.verse_3 },
        ],
        theme: mapEntry.theme,
        source: 'curated',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Fallback: M:D pattern
  const ntBook = NT_BOOK_BY_MONTH[month] ?? 'JHN'
  return new Response(
    JSON.stringify({
      refs: [
        { book: 'PSA', chapter: month, verse: day },
        { book: 'PRO', chapter: month, verse: day },
        { book: ntBook, chapter: month, verse: day },
      ],
      theme: null,
      source: 'generated',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
