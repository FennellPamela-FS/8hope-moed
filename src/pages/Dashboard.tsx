import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PrayerWatchBanner } from '@/components/prayer/PrayerWatchBanner'
import { useAppStore } from '@/contexts/store'
import { getActiveWatch } from '@/lib/watches'
import { getHebrewDate } from '@/lib/hebrew'

export function Dashboard() {
  const { user, setActiveWatch, setHebrewDate, dailyVerses } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    setActiveWatch(getActiveWatch())
    setHebrewDate(getHebrewDate())
  }, [setActiveWatch, setHebrewDate])

  const greeting = getGreeting()

  return (
    <AppShell>
      <div className="px-4 py-5 space-y-5">

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-hope-gray/60 font-body text-sm">{greeting}</p>
          <h2 className="font-heading text-2xl font-bold text-hope-blue">
            {user?.display_name ? `Welcome back, ${user.display_name.split(' ')[0]}` : 'Welcome back'}
          </h2>
        </motion.div>

        {/* Active Prayer Watch */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <PrayerWatchBanner />
        </motion.div>

        {/* The Moed Meditation entry card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={() => navigate('/moed')}
            className="w-full card flex items-center justify-between group hover:shadow-md
                       transition-all duration-200 bg-gradient-to-r from-hope-blue to-hope-blue/80 border-0"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-gold-400" />
              </div>
              <div className="text-left">
                <p className="text-gold-400 font-heading text-xs font-semibold uppercase tracking-widest mb-0.5">
                  Daily Scripture
                </p>
                <h3 className="text-white font-heading font-bold text-base">
                  The Moed Meditation
                </h3>
                {dailyVerses.length > 0 ? (
                  <p className="text-white/60 text-xs mt-0.5 truncate max-w-[200px]">
                    "{dailyVerses[0].text.slice(0, 50)}…"
                  </p>
                ) : (
                  <p className="text-white/50 text-xs mt-0.5">3 verses awaiting you today</p>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors shrink-0" />
          </button>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-heading text-sm font-semibold text-hope-gray/60 uppercase tracking-wider mb-3">
            Quick Access
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickCard
              label="My Journal"
              sub="Write today's reflection"
              emoji="📓"
              to="/journal"
              navigate={navigate}
            />
            <QuickCard
              label="Saved Verses"
              sub="Your favorites"
              emoji="📌"
              to="/favorites"
              navigate={navigate}
            />
          </div>
        </motion.div>

        {/* Watch education teaser */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <button
            onClick={() => navigate('/watches')}
            className="w-full card flex items-center justify-between group hover:shadow-md transition-all"
          >
            <div>
              <p className="font-heading font-semibold text-hope-blue text-sm">Explore All 8 Watches</p>
              <p className="text-hope-gray/60 text-xs mt-0.5">Learn the purpose of every prayer hour</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 transition-colors" />
          </button>
        </motion.div>

      </div>
    </AppShell>
  )
}

function QuickCard({
  label, sub, emoji, to, navigate,
}: {
  label: string; sub: string; emoji: string; to: string;
  navigate: (path: string) => void
}) {
  return (
    <button
      onClick={() => navigate(to)}
      className="card flex flex-col items-start gap-2 hover:shadow-md transition-all text-left"
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="font-heading font-semibold text-hope-blue text-sm">{label}</p>
        <p className="text-hope-gray/60 text-xs">{sub}</p>
      </div>
    </button>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12)  return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Blessed night'
}
