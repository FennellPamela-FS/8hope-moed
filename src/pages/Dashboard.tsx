import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ChevronRight, PenLine, Bookmark } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
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
          <p className="text-hope-gray/50 font-body text-xs uppercase tracking-widest mb-0.5">
            {greeting}
          </p>
          <h2 className="font-heading text-2xl font-bold text-hope-blue">
            {user?.display_name
              ? `Welcome back, ${user.display_name.split(' ')[0]}`
              : 'Welcome back'}
          </h2>
        </motion.div>

        {/* Active Prayer Watch */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <PrayerWatchBanner />
        </motion.div>

        {/* The Moed Meditation */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={() => navigate('/moed')}
            className="w-full card flex items-center justify-between group
                       transition-all duration-200 active:scale-[0.99]
                       bg-gradient-to-br from-hope-blue to-hope-blue/80 border-0 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gold-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <p className="text-gold-400/90 font-heading text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                  Daily Scripture
                </p>
                <h3 className="text-white font-heading font-bold text-base leading-snug">
                  The Moed Meditation
                </h3>
                {dailyVerses.length > 0 ? (
                  <p className="text-white/50 text-xs mt-0.5 truncate max-w-[190px]">
                    "{dailyVerses[0].text.slice(0, 48)}…"
                  </p>
                ) : (
                  <p className="text-white/40 text-xs mt-0.5">3 verses awaiting you today</p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors shrink-0 ml-2" />
          </button>
        </motion.div>

        {/* Quick Access */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SectionLabel>Quick Access</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <QuickCard
              label="My Journal"
              sub="Write today's reflection"
              icon={PenLine}
              iconClass="bg-hope-blue/10 text-hope-blue"
              to="/journal"
              navigate={navigate}
            />
            <QuickCard
              label="Saved Verses"
              sub="Your favorites"
              icon={Bookmark}
              iconClass="bg-gold-500/10 text-gold-600"
              to="/favorites"
              navigate={navigate}
            />
          </div>
        </motion.div>

        {/* Explore Watches */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <button
            onClick={() => navigate('/watches')}
            className="w-full card flex items-center justify-between group
                       hover:shadow-md transition-all duration-200 active:scale-[0.99]"
          >
            <div>
              <p className="font-heading font-semibold text-hope-blue text-sm">Explore All 8 Watches</p>
              <p className="text-hope-gray/50 text-xs mt-0.5">Learn the purpose of every prayer hour</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 transition-colors" />
          </button>
        </motion.div>

      </div>
    </AppShell>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-3.5 rounded-full bg-gold-500" />
      <h3 className="font-heading text-[10px] font-semibold text-hope-gray/50 uppercase tracking-widest">
        {children}
      </h3>
    </div>
  )
}

function QuickCard({
  label, sub, icon: Icon, iconClass, to, navigate,
}: {
  label: string
  sub: string
  icon: LucideIcon
  iconClass: string
  to: string
  navigate: (path: string) => void
}) {
  return (
    <button
      onClick={() => navigate(to)}
      className="card flex flex-col items-start gap-3 hover:shadow-md
                 transition-all duration-200 text-left active:scale-[0.98]"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-heading font-semibold text-hope-blue text-sm leading-snug">{label}</p>
        <p className="text-hope-gray/55 text-xs leading-snug mt-0.5">{sub}</p>
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
