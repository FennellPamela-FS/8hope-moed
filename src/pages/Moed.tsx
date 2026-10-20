import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { VerseCard } from '@/components/meditation/VerseCard'
import { VerseStudyModal } from '@/components/meditation/VerseStudyModal'
import { BibleVersionPicker } from '@/components/meditation/BibleVersionPicker'
import { useAppStore } from '@/contexts/store'
import { fetchVerses, getSafeDailyRefs } from '@/lib/bible'
import { getHebrewDate } from '@/lib/hebrew'
import { supabase } from '@/lib/supabase'
import { MoedExtrasReview } from '@/components/meditation/MoedExtrasReview'
import { MoedExtrasIntro } from '@/components/meditation/MoedExtrasIntro'
import { useMoedExtrasReleased } from '@/hooks/useMoedExtrasReleased'
import type { MoedDailyContent, MoedExtra } from '@/types'
import { Loader2 } from 'lucide-react'

export function Moed() {
  const { user, bibleVersion, language, hebrewDate, setDailyVerses, dailyVerses, moedContent, setMoedContent } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [extras, setExtras] = useState<MoedExtra[] | null>(null)
  const released = useMoedExtrasReleased()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showStudy, setShowStudy] = useState(false)

  const hdate = hebrewDate ?? getHebrewDate()
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()

  // Fetches the day's Moed content (numerology + 3 verse coordinates +
  // devotional commentary) in the current language, then the verse text in
  // the current version. Only re-runs when `language` changes — content
  // doesn't depend on `bibleVersion`, so switching translations shouldn't
  // re-invoke the edge function.
  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      try {
        const { data, error } = await supabase.functions.invoke<MoedDailyContent>('daily-verses', {
          body: { month, day, language },
        })
        if (error || !data || data.verses?.length !== 3) throw error ?? new Error('bad payload')
        if (cancelled) return

        setMoedContent(data)
        const refs = data.verses.map((v) => ({ book: v.book_code, chapter: v.chapter, verse: v.verse }))
        const verses = await fetchVerses(refs, bibleVersion)
        if (!cancelled) setDailyVerses(verses)
      } catch {
        if (cancelled) return
        // Last-resort fallback for a genuine network/outage failure — no
        // attempt to replicate the AI-driven variety client-side.
        setMoedContent(null)
        const refs = getSafeDailyRefs(month, day)
        try {
          const verses = await fetchVerses(refs, bibleVersion)
          if (!cancelled) setDailyVerses(verses)
        } catch {
          if (!cancelled) {
            setDailyVerses(refs.map((r) => ({
              ref: `${r.book} ${r.chapter}:${r.verse}`,
              book: r.book,
              chapter: r.chapter,
              verse: r.verse,
              text: 'Unable to load verse. Please check your connection.',
              version: bibleVersion,
            })))
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  // Re-fetches only the verse text (not devotional content) when the user
  // switches translations within the same language — no edge-function
  // round trip needed, the 3 coordinates are already known. Guarded so it
  // doesn't also fire on first mount before moedContent exists (the
  // language-effect above already handles that initial load).
  useEffect(() => {
    if (!moedContent) return
    let cancelled = false

    async function run() {
      const refs = moedContent!.verses.map((v) => ({ book: v.book_code, chapter: v.chapter, verse: v.verse }))
      try {
        const verses = await fetchVerses(refs, bibleVersion)
        if (!cancelled) setDailyVerses(verses)
      } catch {
        // Leave the previously-loaded verses in place rather than clearing
        // a working page over a transient re-fetch failure.
      }
    }

    run()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bibleVersion])

  // Optional Reflection / Deeper Word Study. Reviewers see both while they
  // are unreleased (marked "Preview"); after release, each user sees what
  // they switched on in Settings → Moed Content.
  const reviewer = !!user?.moed_reviewer
  const reviewing = reviewer && released === false
  const showReflection = reviewing || (!!released && !!user?.moed_show_reflection)
  const showDeepStudy = reviewing || (!!released && !!user?.moed_show_deep_study)

  useEffect(() => {
    setExtras(null)
    if (!moedContent || moedContent.language !== language || released === null) return
    if (!showReflection && !showDeepStudy) return
    let cancelled = false
    supabase.functions
      .invoke<{ extras: MoedExtra[] }>('moed-extras', { body: { month, day, language } })
      .then(({ data }) => { if (!cancelled && data?.extras?.length === 3) setExtras(data.extras) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moedContent, language, released, showReflection, showDeepStudy])

  function openStudy(index: number) {
    setSelectedIndex(index)
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

        {/* One-time introduction after release */}
        {released && user && !user.moed_extras_intro_seen && <MoedExtrasIntro />}

        {/* Month numerology */}
        {!loading && moedContent?.month_numerology && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-gold-500/5 border-gold-500/20 text-center"
          >
            <p className="uppercase text-3xs font-heading font-semibold text-gold-600 tracking-widest mb-1">
              The Biblical Meaning of Month {month} · {moedContent.month_numerology.theme}
            </p>
            <p className="text-hope-gray/70 text-xs font-body leading-relaxed">
              {moedContent.month_numerology.explanation}
            </p>
          </motion.div>
        )}

        {/* Bible version picker */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
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
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <VerseCard
                  verse={verse}
                  verseNumber={i + 1}
                  study={moedContent?.verses[i]}
                  reflection={showReflection ? extras?.[i]?.reflection : undefined}
                  preview={reviewing}
                  onStudy={() => openStudy(i)}
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

        {/* Reviewer feedback while the new sections are unreleased */}
        {reviewing && extras && user && (
          <MoedExtrasReview userId={user.id} month={month} day={day} language={language} />
        )}

      </div>

      {/* AI Study Modal */}
      {showStudy && selectedIndex !== null && dailyVerses[selectedIndex] && (
        <VerseStudyModal
          verse={dailyVerses[selectedIndex]}
          study={moedContent?.verses[selectedIndex] ?? null}
          deepStudy={showDeepStudy ? extras?.[selectedIndex] ?? null : null}
          preview={reviewing}
          onClose={() => setShowStudy(false)}
        />
      )}
    </AppShell>
  )
}
