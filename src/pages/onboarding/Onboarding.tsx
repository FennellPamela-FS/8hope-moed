import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PRAYER_WATCHES } from '@/lib/watches'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/contexts/store'
import type { WatchName } from '@/types'
import { ChevronRight, ChevronLeft, Moon, Clock, HandHeart, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = ['Welcome', 'About Watches', 'Your Time', 'You\'re Set']

export function Onboarding() {
  const [step, setStep] = useState(0)
  const [selectedWatch, setSelectedWatch] = useState<WatchName | null>(null)
  const [saving, setSaving] = useState(false)
  const { user, setUser } = useAppStore()
  const navigate = useNavigate()

  async function handleFinish() {
    if (!user || !selectedWatch) return
    setSaving(true)

    await supabase
      .from('user_profiles')
      .update({ divine_time_watch: selectedWatch, onboarding_complete: true })
      .eq('id', user.id)

    setUser({ ...user, divine_time_watch: selectedWatch, onboarding_complete: true })
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-hope-dark flex flex-col">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-10 pb-4">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === step ? 'w-8 bg-gold-500' : i < step ? 'w-4 bg-gold-500/60' : 'w-4 bg-white/20'
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col px-6 py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <Moon className="w-16 h-16 text-gold-500 mb-6" />
              <h1 className="font-heading text-3xl font-bold text-white mb-4">
                Welcome to 8Hope
              </h1>
              <p className="text-white/70 text-base leading-relaxed max-w-xs">
                Have you ever woken up at 3am, 4am, or an unusual hour — and wondered why?
              </p>
              <p className="text-white/70 text-base leading-relaxed max-w-xs mt-4">
                The Bible reveals 8 prayer watches — sacred time slots where God calls His people to pray.
                You may already be living in yours.
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              <Clock className="w-12 h-12 text-gold-500 mb-4 mx-auto" />
              <h2 className="font-heading text-2xl font-bold text-white text-center mb-2">
                The 8 Prayer Watches
              </h2>
              <p className="text-white/60 text-sm text-center mb-6">
                The biblical day begins at evening — "evening and morning was the first day."
              </p>
              <div className="space-y-2">
                {PRAYER_WATCHES.map((w) => (
                  <div key={w.watch_key} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                    <span className="font-heading font-bold text-gold-500 text-sm w-16 shrink-0">
                      {w.time_label.split('–')[0].trim()}
                    </span>
                    <div>
                      <p className="text-white font-heading text-sm font-semibold">{w.label}</p>
                      <p className="text-white/50 text-xs">{w.focus}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              <HandHeart className="w-12 h-12 text-gold-500 mb-4 mx-auto" />
              <h2 className="font-heading text-2xl font-bold text-white text-center mb-2">
                Find Your Divine Time
              </h2>
              <p className="text-white/60 text-sm text-center mb-6">
                Which watch aligns with when you feel most drawn to pray or often find yourself awake?
              </p>
              <div className="space-y-2">
                {PRAYER_WATCHES.map((w) => (
                  <button
                    key={w.watch_key}
                    onClick={() => setSelectedWatch(w.watch_key as WatchName)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
                      selectedWatch === w.watch_key
                        ? 'bg-gold-500 text-white'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    )}
                  >
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-sm">{w.label} — {w.time_label}</p>
                      <p className={cn('text-xs mt-0.5', selectedWatch === w.watch_key ? 'text-white/80' : 'text-white/50')}>
                        {w.focus}
                      </p>
                    </div>
                    {selectedWatch === w.watch_key && (
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <CheckCircle2 className="w-16 h-16 text-gold-500 mb-6" />
              <h2 className="font-heading text-3xl font-bold text-white mb-4">You're Set</h2>
              {selectedWatch && (
                <div className="bg-white/10 rounded-2xl px-6 py-4 mb-6 max-w-xs">
                  <p className="text-white/60 text-sm mb-1">Your Divine Time</p>
                  <p className="text-gold-400 font-heading font-bold text-lg">
                    {PRAYER_WATCHES.find(w => w.watch_key === selectedWatch)?.label}
                  </p>
                  <p className="text-white/70 text-sm">
                    {PRAYER_WATCHES.find(w => w.watch_key === selectedWatch)?.time_label}
                  </p>
                </div>
              )}
              <p className="text-white/60 text-sm max-w-xs">
                Each day, 8Hope will meet you here with scripture, a Moed meditation, and a prayer prompt for your watch.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-10 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="btn-outline flex items-center gap-1 flex-1 justify-center border-white/30 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 2 && !selectedWatch}
            className="btn-gold flex items-center gap-1 flex-1 justify-center disabled:opacity-40"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={saving}
            className="btn-gold flex-1"
          >
            {saving ? 'Saving…' : 'Enter 8Hope'}
          </button>
        )}
      </div>
    </div>
  )
}
