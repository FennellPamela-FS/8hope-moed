import { useEffect, useState } from 'react'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { AxiosAnchor, AxiosGuide, AxiosWordRelation } from '@/types'

interface MeditationGuideProps {
  wordId: string
  anchors: AxiosAnchor[]
  relation: AxiosWordRelation
  givenTo: string | null
}

const ERROR_MESSAGES: Record<string, string> = {
  no_anchors: 'Add at least one anchor before creating a guide.',
  scripture_unavailable: 'Scripture could not be loaded right now. Please try again shortly.',
}

/**
 * The word's 7-day meditation guide. Generated once by the axios-guide edge
 * function and saved; offered for refresh only after the anchors change.
 */
export function MeditationGuide({ wordId, anchors, relation, givenTo }: MeditationGuideProps) {
  const [guide, setGuide] = useState<AxiosGuide | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [day, setDay] = useState(1)

  useEffect(() => {
    supabase
      .from('axios_guides')
      .select('*')
      .eq('word_id', wordId)
      .maybeSingle()
      .then(({ data }) => {
        const g = data as AxiosGuide | null
        setGuide(g)
        if (g) setDay(todaysDay(g.generated_at))
        setLoaded(true)
      })
  }, [wordId])

  const stale = !!guide && (
    guide.relation !== relation ||
    guide.anchor_count !== anchors.length ||
    anchors.some((a) => Date.parse(a.updated_at) > Date.parse(guide.generated_at))
  )

  async function generate() {
    setGenerating(true)
    setError(null)
    const { data, error } = await supabase.functions.invoke<{ guide: AxiosGuide }>('axios-guide', {
      body: { word_id: wordId },
    })
    setGenerating(false)
    if (error || !data?.guide) {
      let code = ''
      try { code = (await (error as { context?: Response })?.context?.json())?.error ?? '' } catch { /* not JSON */ }
      setError(ERROR_MESSAGES[code] ?? 'The guide could not be created right now. Please try again in a moment.')
      return
    }
    setGuide(data.guide)
    setDay(1)
  }

  if (!loaded) return null

  if (!guide) {
    return (
      <div className="card text-center space-y-3">
        <Sparkles className="w-6 h-6 text-gold-500 mx-auto" />
        <div>
          <h3 className="font-heading font-bold text-hope-blue">7-Day Meditation Guide</h3>
          <p className="text-hope-gray/60 text-xs font-body mt-1">
            {relation === 'given'
              ? `A week of remembering, declaring, and interceding over the word you gave${givenTo ? ` ${givenTo}` : ''}, built on Romans 8.`
              : 'A week of meditation, declaration, and prayer through your anchors, built on Romans 8.'}
          </p>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          onClick={generate}
          disabled={generating || anchors.length === 0}
          className="btn-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-40"
        >
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing your guide…</> : 'Create my 7-day guide'}
        </button>
        {generating && <p className="text-hope-gray/40 text-2xs">This can take up to a minute.</p>}
      </div>
    )
  }

  const current = guide.days.find((d) => d.day === day) ?? guide.days[0]

  return (
    <div className="space-y-3">
      {stale && (
        <div className="card bg-gold-500/5 border-gold-500/20 flex items-center justify-between gap-3">
          <p className="text-hope-gray/80 text-xs font-body">
            {guide.relation !== relation ? 'This word changed between "over me" and "given" since this guide was written.' : 'Your anchors changed since this guide was written.'}
          </p>
          <button
            onClick={generate}
            disabled={generating}
            className="shrink-0 flex items-center gap-1.5 text-xs font-heading font-semibold text-gold-600 disabled:opacity-40"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh guide
          </button>
        </div>
      )}
      {error && <p className="text-red-500 text-xs">{error}</p>}

      {/* Day picker */}
      <div className="grid grid-cols-7 gap-1.5">
        {guide.days.map((d) => (
          <button
            key={d.day}
            onClick={() => setDay(d.day)}
            className={cn(
              'py-2 rounded-xl text-xs font-heading font-semibold border transition-colors',
              d.day === day ? 'bg-hope-blue text-white border-hope-blue' : 'bg-white text-hope-gray/60 border-gray-200',
            )}
          >
            {d.day}
          </button>
        ))}
      </div>

      <div className="card space-y-4">
        <div>
          <p className="text-3xs font-heading font-semibold text-gold-600 uppercase tracking-widest">
            Day {current.day}{current.anchors.length > 0 && ` · ${current.anchors.join(' · ')}`}
          </p>
          <h3 className="font-heading font-bold text-hope-blue text-lg leading-snug">{current.title}</h3>
          {current.scriptures.length > 0 && (
            <p className="text-hope-blue/60 text-xs font-heading font-semibold mt-1">{current.scriptures.join(' · ')}</p>
          )}
        </div>

        <GuideBlock label="Meditate">{current.meditation}</GuideBlock>

        <div className="rounded-xl bg-hope-blue p-4">
          <p className="text-gold-400 text-3xs font-heading font-semibold uppercase tracking-widest mb-1">Declare</p>
          <p className="text-white font-heading font-semibold text-sm leading-relaxed">"{current.declaration}"</p>
        </div>

        <GuideBlock label="Pray">{current.prayer}</GuideBlock>

        <div className="rounded-xl bg-hope-green/5 border border-hope-green/15 p-3">
          <p className="text-hope-green text-3xs font-heading font-semibold uppercase tracking-widest mb-1">Walk It Out Today</p>
          <p className="text-hope-gray text-sm font-body leading-relaxed">{current.action_step}</p>
        </div>
      </div>
    </div>
  )
}

function GuideBlock({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="text-hope-gray/50 text-3xs font-heading font-semibold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-hope-gray text-sm font-body leading-relaxed whitespace-pre-line">{children}</p>
    </div>
  )
}

/** Which day of the 7-day cycle today is, counting from when the guide was written. */
function todaysDay(generatedAt: string): number {
  const start = new Date(generatedAt)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const elapsed = Math.round((today.getTime() - start.getTime()) / 86_400_000)
  return (Math.max(elapsed, 0) % 7) + 1
}
