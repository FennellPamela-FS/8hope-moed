import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { VerseCard } from '@/components/meditation/VerseCard'
import { VerseStudyModal } from '@/components/meditation/VerseStudyModal'
import { BibleVersionPicker } from '@/components/meditation/BibleVersionPicker'
import { useAppStore } from '@/contexts/store'
import { fetchVerses } from '@/lib/bible'
import { getHebrewDate } from '@/lib/hebrew'
import { NT_BOOK_BY_MONTH } from '@/lib/bible'
import { supabase } from '@/lib/supabase'
import type { BibleVerse, VerseRef } from '@/types'
import { Loader2 } from 'lucide-react'

export function Moed() {
  const { bibleVersion, hebrewDate, setDailyVerses, dailyVerses } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null)
  const [showStudy, setShowStudy] = useState(false)

  const hdate = hebrewDate ?? getHebrewDate()
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()

  useEffect(() => {
    loadVerses()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bibleVersion])

  async function loadVerses() {
    setLoading(true)

    // Try to fetch verse refs from Supabase verse_map first
    const { data: mapEntry } = await supabase
      .from('verse_map')
      .select('*')
      .eq('month', month)
      .eq('day', day)
      .single()

    let refs: VerseRef[]

    if (mapEntry) {
      refs = [
        { book: mapEntry.book_1, chapter: mapEntry.chapter_1, verse: mapEntry.verse_1 },
        { book: mapEntry.book_2, chapter: mapEntry.chapter_2, verse: mapEntry.verse_2 },
        { book: mapEntry.book_3, chapter: mapEntry.chapter_3, verse: mapEntry.verse_3 },
      ]
    } else {
      // Fallback: M:D pattern (month=chapter, day=verse)
      const ntBook = NT_BOOK_BY_MONTH[month] ?? 'JHN'
      refs = [
        { book: 'PSA', chapter: month, verse: day },
        { book: 'PRO', chapter: month, verse: day },
        { book: ntBook, chapter: month, verse: day },
      ]
    }

    try {
      const verses = await fetchVerses(refs, bibleVersion)
      setDailyVerses(verses)
    } catch {
      // If API fails, show refs without text
      setDailyVerses(refs.map((r) => ({
        ref: `${r.book} ${r.chapter}:${r.verse}`,
        book: r.book,
        chapter: r.chapter,
        verse: r.verse,
        text: 'Unable to load verse. Please check your connection.',
        version: bibleVersion,
      })))
    }

    setLoading(false)
  }

  function openStudy(verse: BibleVerse) {
    setSelectedVerse(verse)
    setShowStudy(true)
  }

  return (
    <AppShell title="The Moed Meditation">
      <div className="px-4 py-5 space-y-5">

        {/* Hebrew date + intro */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-gold-500 font-heading text-xs font-semibold uppercase tracking-widest mb-1">
            Today's Moed
          </p>
          <h2 className="font-heading text-2xl font-bold text-hope-blue">{hdate.formatted}</h2>
          <p className="text-hope-gray/60 text-sm mt-1">
            Hebrew Year {hdate.year} · {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Bible version picker */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <BibleVersionPicker />
        </motion.div>

        {/* Daily verses */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {dailyVerses.map((verse, i) => (
              <motion.div
                key={verse.ref}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
              >
                <VerseCard
                  verse={verse}
                  verseNumber={i + 1}
                  onStudy={() => openStudy(verse)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Prompt */}
        {!loading && dailyVerses.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="card bg-hope-blue/5 border-hope-blue/10 text-center"
          >
            <p className="text-hope-blue/70 font-body text-sm leading-relaxed">
              Select any verse above to receive a deeper Hebrew or Greek revelation for today.
            </p>
          </motion.div>
        )}

      </div>

      {/* AI Study Modal */}
      {showStudy && selectedVerse && (
        <VerseStudyModal
          verse={selectedVerse}
          hebrewDate={hdate.formatted}
          onClose={() => setShowStudy(false)}
        />
      )}
    </AppShell>
  )
}
