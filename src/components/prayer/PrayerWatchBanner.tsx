import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'
import type { AxiosAnchor } from '@/types'

type BannerAnchor = Pick<AxiosAnchor, 'id' | 'title' | 'phrase'> & {
  axios_words: { relation: 'over_me' | 'given'; given_to: string | null } | null
}

export function PrayerWatchBanner() {
  const { activeWatch, hebrewDate, user } = useAppStore()
  const navigate = useNavigate()
  const [anchors, setAnchors] = useState<BannerAnchor[]>([])

  const axiosActive = !!user?.axios_enabled && !!user.axios_opted_in_at

  useEffect(() => {
    if (!axiosActive || !user) return
    supabase
      .from('axios_anchors')
      .select('id, title, phrase, axios_words(relation, given_to)')
      .eq('user_id', user.id)
      .order('created_at')
      // axios_words is many-to-one, so it comes back as an object; the
      // untyped client infers an array, hence the cast.
      .then(({ data }) => setAnchors((data as unknown as BannerAnchor[]) ?? []))
  }, [axiosActive, user])

  if (!activeWatch) return null

  // A different AXIOS anchor for each watch, shifting day by day so every
  // anchor comes around.
  const anchor = anchors.length > 0
    ? anchors[(dayOfYear() * 8 + activeWatch.watch_number - 1) % anchors.length]
    : null

  return (
    <button
      onClick={() => navigate('/watches')}
      className="w-full rounded-2xl p-5 text-left relative overflow-hidden"
      style={{ backgroundColor: activeWatch.color }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 right-4 text-8xl font-bold text-white select-none">
          {activeWatch.watch_number}
        </div>
      </div>

      <div className="relative z-10">
        {/* Hebrew date */}
        {hebrewDate && (
          <p className="text-white/70 text-xs font-body mb-3">{hebrewDate.formatted}</p>
        )}

        {/* Watch label */}
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-white/80" />
          <span className="text-white/80 text-xs font-heading font-semibold uppercase tracking-wider">
            Active Watch
          </span>
        </div>
        <h3 className="text-white font-heading font-bold text-xl">{activeWatch.label}</h3>
        <p className="text-white/80 text-sm font-body">{activeWatch.time_label}</p>

        {/* Focus */}
        <div className="mt-3 border-t border-white/20 pt-3">
          <p className="text-white/90 text-xs font-heading font-semibold uppercase tracking-wider mb-1">
            {activeWatch.focus}
          </p>
          <p className="text-white/70 text-xs font-body leading-relaxed line-clamp-2">
            {activeWatch.meditation_prompt}
          </p>
        </div>

        {/* AXIOS anchor for this watch */}
        {anchor && (
          <div className="mt-3 rounded-xl bg-black/15 px-3 py-2">
            <p className="text-white/70 text-[10px] font-heading font-semibold uppercase tracking-wider mb-0.5">
              {anchor.axios_words?.relation === 'given'
                ? `Praying for ${anchor.axios_words.given_to ?? 'them'} · ${anchor.title}`
                : `AXIOS Anchor · ${anchor.title}`}
            </p>
            <p className="text-white text-xs font-heading font-semibold leading-snug">"{anchor.phrase}"</p>
          </div>
        )}
      </div>
    </button>
  )
}

function dayOfYear(): number {
  const now = new Date()
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000)
}
