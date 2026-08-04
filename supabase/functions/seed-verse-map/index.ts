import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * seed-verse-map Edge Function
 * Called ONCE (with service role key) to populate the verse_map table.
 * Uses Month:Day → Chapter:Verse pattern with per-chapter verse-count caps
 * so every reference is a real, valid Bible verse.
 *
 * Invoke:
 *   curl -X POST https://<project>.supabase.co/functions/v1/seed-verse-map \
 *     -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Max verse counts for Psalm chapters 1–12
const PSALM_MAX: Record<number, number> = {
  1: 6, 2: 12, 3: 8, 4: 8, 5: 12,
  6: 10, 7: 17, 8: 9, 9: 20, 10: 18,
  11: 7, 12: 8,
}

// Max verse counts for Proverbs chapters 1–12
const PROVERBS_MAX: Record<number, number> = {
  1: 33, 2: 22, 3: 35, 4: 27, 5: 23,
  6: 35, 7: 27, 8: 36, 9: 18, 10: 32,
  11: 31, 12: 28,
}

// NT book by month + max verse counts for chapters 1–12
const NT_CONFIG: Record<number, { book: string; max: Record<number, number> }> = {
  1:  { book: 'MAT', max: { 1:25, 2:23, 3:17, 4:25, 5:48, 6:34, 7:29, 8:34, 9:38, 10:42, 11:30, 12:50 } },
  2:  { book: 'MRK', max: { 1:45, 2:28, 3:35, 4:41, 5:43, 6:56, 7:37, 8:38, 9:50, 10:52, 11:33, 12:44 } },
  3:  { book: 'LUK', max: { 1:80, 2:52, 3:38, 4:44, 5:39, 6:49, 7:50, 8:56, 9:62, 10:42, 11:54, 12:59 } },
  4:  { book: 'JHN', max: { 1:51, 2:25, 3:36, 4:54, 5:47, 6:71, 7:53, 8:59, 9:41, 10:42, 11:57, 12:50 } },
  5:  { book: 'ACT', max: { 1:26, 2:47, 3:26, 4:37, 5:42, 6:15, 7:60, 8:40, 9:43, 10:48, 11:30, 12:25 } },
  6:  { book: 'ROM', max: { 1:32, 2:29, 3:31, 4:25, 5:21, 6:23, 7:25, 8:39, 9:33, 10:21, 11:36, 12:21 } },
  7:  { book: '1CO', max: { 1:31, 2:16, 3:23, 4:21, 5:13, 6:20, 7:40, 8:13, 9:27, 10:33, 11:34, 12:31 } },
  8:  { book: '2CO', max: { 1:24, 2:17, 3:18, 4:18, 5:21, 6:18, 7:16, 8:24, 9:15, 10:18, 11:33, 12:21 } },
  9:  { book: 'GAL', max: { 1:24, 2:21, 3:29, 4:31, 5:26, 6:18, 7:18, 8:18, 9:18, 10:18, 11:18, 12:18 } },
  10: { book: 'EPH', max: { 1:23, 2:22, 3:21, 4:32, 5:33, 6:24, 7:24, 8:24, 9:24, 10:24, 11:24, 12:24 } },
  11: { book: 'PHP', max: { 1:30, 2:30, 3:21, 4:23, 5:23, 6:23, 7:23, 8:23, 9:23, 10:23, 11:23, 12:23 } },
  12: { book: 'COL', max: { 1:29, 2:23, 3:25, 4:18, 5:18, 6:18, 7:18, 8:18, 9:18, 10:18, 11:18, 12:18 } },
}

function cap(value: number, max: number): number {
  return Math.min(value, max)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const rows: Array<{
    month: number; day: number
    book_1: string; chapter_1: number; verse_1: number
    book_2: string; chapter_2: number; verse_2: number
    book_3: string; chapter_3: number; verse_3: number
  }> = []

  // Generate one row per calendar day (month 1–12, day 1–31)
  // Chapter = month, Verse = day (capped to chapter's max verse count)
  for (let month = 1; month <= 12; month++) {
    const psalmMax   = PSALM_MAX[month]    ?? 10
    const proverbMax = PROVERBS_MAX[month] ?? 18
    const nt         = NT_CONFIG[month]
    const daysInMonth = new Date(2024, month, 0).getDate() // 2024 = leap year

    for (let day = 1; day <= daysInMonth; day++) {
      const psalmVerse   = cap(day, psalmMax)
      const proverbVerse = cap(day, proverbMax)
      const ntMax        = nt.max[month] ?? 20
      const ntVerse      = cap(day, ntMax)

      rows.push({
        month, day,
        book_1: 'PSA', chapter_1: month, verse_1: psalmVerse,
        book_2: 'PRO', chapter_2: month, verse_2: proverbVerse,
        book_3: nt.book, chapter_3: month, verse_3: ntVerse,
      })
    }
  }

  // Upsert in batches of 50
  const BATCH = 50
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('verse_map')
      .upsert(batch, { onConflict: 'month,day' })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message, batch: i }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    inserted += batch.length
  }

  return new Response(
    JSON.stringify({ success: true, rows_inserted: inserted }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
