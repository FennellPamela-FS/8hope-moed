import { AppShell } from '@/components/layout/AppShell'
import { BibleVersionPicker } from '@/components/meditation/BibleVersionPicker'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'
import { PRAYER_WATCHES } from '@/lib/watches'
import { LANGUAGES, LANGUAGE_LABELS } from '@/lib/bible'
import { cn } from '@/lib/utils'
import { LogOut, Bell } from 'lucide-react'
import type { WatchName } from '@/types'
import { motion } from 'framer-motion'

export function Settings() {
  const { user, setUser, language, setLanguage } = useAppStore()

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  async function updateDivineTime(watch: WatchName) {
    if (!user) return
    await supabase
      .from('user_profiles')
      .update({ divine_time_watch: watch })
      .eq('id', user.id)
    setUser({ ...user, divine_time_watch: watch })
  }

  return (
    <AppShell title="Settings">
      <div className="px-4 py-5 space-y-6">

        {/* Profile */}
        {user && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card text-center">
            <div className="w-14 h-14 rounded-full bg-hope-blue/10 flex items-center justify-center mx-auto mb-3">
              <span className="font-heading font-bold text-hope-blue text-xl">
                {user.email[0].toUpperCase()}
              </span>
            </div>
            <p className="font-heading font-semibold text-hope-blue">{user.display_name ?? 'My Account'}</p>
            <p className="text-hope-gray/50 text-sm">{user.email}</p>
          </motion.div>
        )}

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
          <h3 className="font-heading font-semibold text-hope-blue mb-1">Language</h3>
          <p className="text-hope-gray/50 text-xs mb-3">Bible verses and devotional content — menus stay in English</p>
          <div className="flex gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'flex-1 px-3 py-2.5 rounded-xl text-sm font-heading font-semibold transition-all',
                  language === lang
                    ? 'bg-hope-blue text-white shadow-sm'
                    : 'bg-gray-50 text-hope-gray hover:bg-gray-100'
                )}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Bible version */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <h3 className="font-heading font-semibold text-hope-blue mb-3">Bible Translation</h3>
          <BibleVersionPicker />
        </motion.div>

        {/* Divine time */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
          <h3 className="font-heading font-semibold text-hope-blue mb-1">My Divine Time</h3>
          <p className="text-hope-gray/50 text-xs mb-3">The prayer watch you feel most called to</p>
          <div className="space-y-2">
            {PRAYER_WATCHES.map((w) => (
              <button
                key={w.watch_key}
                onClick={() => updateDivineTime(w.watch_key as WatchName)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all text-sm',
                  user?.divine_time_watch === w.watch_key
                    ? 'bg-hope-blue text-white'
                    : 'bg-gray-50 text-hope-gray hover:bg-gray-100'
                )}
              >
                <span className="font-heading font-semibold">{w.label}</span>
                <span className={cn(
                  'text-xs',
                  user?.divine_time_watch === w.watch_key ? 'text-white/70' : 'text-hope-gray/50'
                )}>
                  {w.time_label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Notifications placeholder */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-hope-blue flex items-center gap-2">
                <Bell className="w-4 h-4" /> Watch Reminders
              </h3>
              <p className="text-hope-gray/50 text-xs mt-0.5">Coming in Phase 2</p>
            </div>
            <div className="w-10 h-6 rounded-full bg-gray-200" />
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                       border border-red-200 text-red-500 font-heading font-semibold text-sm
                       hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </motion.div>

        <p className="text-center text-hope-gray/30 text-xs pb-2">8Hope · Phase 1</p>

      </div>
    </AppShell>
  )
}
