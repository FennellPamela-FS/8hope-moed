import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Clock, Star } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PRAYER_WATCHES, getActiveWatch } from '@/lib/watches'
import { useAppStore } from '@/contexts/store'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { PrayerWatch, WatchName } from '@/types'

/** An AXIOS anchor paired with a watch, as shown inside that watch. */
interface WatchAnchor {
  watch_key: WatchName
  reason: string | null
  axios_anchors: {
    id: string
    title: string
    phrase: string
    word_id: string
    axios_words: { title: string; relation: 'over_me' | 'given'; given_to: string | null } | null
  } | null
}

export function Watches() {
  const { user, activeWatch } = useAppStore()
  const currentWatch = activeWatch ?? getActiveWatch()
  const [expanded, setExpanded] = useState<string | null>(currentWatch.watch_key)
  const [watchAnchors, setWatchAnchors] = useState<WatchAnchor[]>([])

  // AXIOS pairings appear only for members who have opted in.
  const axiosActive = !!user?.axios_enabled && !!user.axios_opted_in_at

  useEffect(() => {
    if (!axiosActive || !user) return
    supabase
      .from('axios_anchor_watches')
      .select('watch_key, reason, axios_anchors(id, title, phrase, word_id, axios_words(title, relation, given_to))')
      .eq('user_id', user.id)
      // Embedded many-to-one relations come back as objects; the untyped
      // client infers arrays, hence the cast.
      .then(({ data }) => setWatchAnchors((data as unknown as WatchAnchor[]) ?? []))
  }, [axiosActive, user])

  function toggle(key: string) {
    setExpanded((prev) => (prev === key ? null : key))
  }

  return (
    <AppShell title="Prayer Watches">
      <div className="px-4 py-5 space-y-4">

        {/* Intro */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-hope-gray/70 text-sm font-body leading-relaxed">
            The biblical day begins at evening — <span className="italic">"evening and morning was the first day"</span> (Genesis 1).
            There are 8 prayer watches, each 3 hours long, beginning at sundown (6 PM) and covering the full 24-hour cycle.
          </p>
        </motion.div>

        {/* Watch list */}
        <div className="space-y-2">
          {PRAYER_WATCHES.map((watch, i) => (
            <WatchAccordion
              key={watch.watch_key}
              watch={watch}
              isExpanded={expanded === watch.watch_key}
              isActive={currentWatch.watch_key === watch.watch_key}
              isDivineTime={user?.divine_time_watch === watch.watch_key}
              axiosActive={axiosActive}
              anchors={watchAnchors.filter((a) => a.watch_key === watch.watch_key && a.axios_anchors)}
              onToggle={() => toggle(watch.watch_key)}
              delay={i * 0.05}
            />
          ))}
        </div>

        <p className="text-center text-hope-gray/30 text-xs pb-2">
          Change your Divine Time in Settings
        </p>

      </div>
    </AppShell>
  )
}

interface WatchAccordionProps {
  watch: PrayerWatch
  isExpanded: boolean
  isActive: boolean
  isDivineTime: boolean
  axiosActive: boolean
  anchors: WatchAnchor[]
  onToggle: () => void
  delay: number
}

function WatchAccordion({ watch, isExpanded, isActive, isDivineTime, axiosActive, anchors, onToggle, delay }: WatchAccordionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'rounded-2xl overflow-hidden border transition-all duration-200',
        isExpanded ? 'border-transparent shadow-md' : 'border-gray-100 bg-white',
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
          isExpanded ? 'text-white' : 'bg-white text-hope-blue hover:bg-gray-50',
        )}
        style={isExpanded ? { backgroundColor: watch.color } : undefined}
      >
        {/* Watch number */}
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-heading font-bold text-sm',
          isExpanded ? 'bg-white/20 text-white' : 'bg-gray-100 text-hope-blue',
        )}>
          {watch.watch_number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-bold text-sm">{watch.label}</span>
            {isActive && (
              <span className={cn(
                'text-3xs font-heading font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide',
                isExpanded ? 'bg-white/20 text-white' : 'bg-gold-100 text-gold-600',
              )}>
                Active Now
              </span>
            )}
            {isDivineTime && (
              <Star className={cn('w-3.5 h-3.5', isExpanded ? 'text-white/80' : 'text-gold-500')} fill="currentColor" />
            )}
          </div>
          <p className={cn(
            'text-xs mt-0.5',
            isExpanded ? 'text-white/70' : 'text-hope-gray/50',
          )}>
            {watch.time_label} · {watch.focus}
          </p>
        </div>

        <ChevronDown className={cn(
          'w-4 h-4 shrink-0 transition-transform duration-200',
          isExpanded ? 'rotate-180 text-white/70' : 'text-gray-300',
        )} />
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-white px-4 py-4 space-y-4 border-t border-gray-100">

              {/* Description */}
              <p className="text-hope-gray font-body text-sm leading-relaxed">
                {watch.description}
              </p>

              {/* Scripture */}
              <div className="bg-hope-blue/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-hope-blue/50" />
                  <span className="text-xs font-heading font-semibold text-hope-blue/60 uppercase tracking-wider">
                    Key Scripture
                  </span>
                </div>
                <p className="font-heading font-bold text-hope-blue text-sm">{watch.scripture_ref}</p>
                <p className="text-hope-gray/70 text-xs font-body italic leading-relaxed mt-1">
                  {watch.scripture_text}
                </p>
              </div>

              {/* Meditation prompt */}
              <div
                className="rounded-xl p-3 text-white"
                style={{ backgroundColor: watch.color }}
              >
                <p className="text-xs font-heading font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Meditation Prompt
                </p>
                <p className="text-sm font-body leading-relaxed">
                  {watch.meditation_prompt}
                </p>
              </div>

              {axiosActive && <WatchAxiosAnchors anchors={anchors} />}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/** The AXIOS anchors the user paired with this watch. */
function WatchAxiosAnchors({ anchors }: { anchors: WatchAnchor[] }) {
  const navigate = useNavigate()
  return (
    <div className="space-y-2">
      <p className="text-xs font-heading font-semibold text-gold-600 uppercase tracking-wider">Your AXIOS Anchors</p>
      {anchors.length === 0 ? (
        <p className="text-hope-gray/50 text-xs font-body">
          No anchors paired with this watch yet. Open any AXIOS word and tap "Pair with prayer watches."
        </p>
      ) : (
        anchors.map(({ axios_anchors: a, reason }) => {
          const word = a!.axios_words
          return (
            <button
              key={a!.id}
              onClick={() => navigate(`/axios/${a!.word_id}`)}
              className="w-full text-left rounded-xl border border-gold-500/20 bg-gold-500/5 p-3 flex items-start justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-3xs font-heading font-semibold text-hope-gray/50 uppercase tracking-wider">
                  {word?.relation === 'given' ? `Praying for ${word.given_to ?? 'them'}` : word?.title}
                </p>
                <p className="font-heading font-bold text-hope-blue text-sm">{a!.title}</p>
                <p className="text-hope-gray text-xs font-heading font-semibold leading-snug mt-0.5">"{a!.phrase}"</p>
                {reason && <p className="text-hope-gray/55 text-xs font-body italic mt-1">{reason}</p>}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
            </button>
          )
        })
      )}
    </div>
  )
}
