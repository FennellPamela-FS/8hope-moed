import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useAppStore } from '@/contexts/store'

export function PrayerWatchBanner() {
  const { activeWatch, hebrewDate } = useAppStore()
  const navigate = useNavigate()

  if (!activeWatch) return null

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
      </div>
    </button>
  )
}
