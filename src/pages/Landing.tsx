import { motion } from 'framer-motion'
import { Clock, BookOpen, Sparkles, Moon, ChevronRight } from 'lucide-react'

interface LandingProps {
  onEnter: () => void
}

const FEATURES = [
  {
    icon: Clock,
    title: 'Your Divine Time',
    body: 'Discover which of the 8 biblical prayer watches aligns with when God calls you to pray.',
  },
  {
    icon: BookOpen,
    title: 'The Moed Meditation',
    body: 'Three daily scriptures drawn from Psalms, Proverbs, and the New Testament — fresh every morning.',
  },
  {
    icon: Sparkles,
    title: 'Deep Study',
    body: 'Unlock the original Hebrew and Greek meaning behind each verse with AI-guided revelation.',
  },
]

export function Landing({ onEnter }: LandingProps) {
  return (
    <div className="min-h-screen bg-hope-dark flex flex-col overflow-y-auto">

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-gold-500/10 border border-gold-500/30 mx-auto mb-6">
            <Moon className="w-10 h-10 text-gold-500" />
          </div>
          <h1 className="font-heading text-5xl font-bold text-gradient-gold mb-3">8Hope</h1>
          <p className="text-white/60 font-body text-lg leading-relaxed max-w-xs mx-auto">
            Have you ever woken at 3am, 4am, or an unusual hour — and wondered why?
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-4"
        >
          <p className="text-white/40 font-body text-sm leading-relaxed max-w-sm mx-auto">
            The Bible reveals 8 sacred prayer watches — ancient time slots where God calls His people to pray.
            You may already be living in yours.
          </p>
        </motion.div>
      </div>

      {/* Feature cards */}
      <div className="px-5 space-y-3 pb-10">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <p className="font-heading font-bold text-white text-sm">{title}</p>
              <p className="text-white/50 font-body text-sm leading-relaxed mt-0.5">{body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="px-5 pb-14"
      >
        <button
          onClick={onEnter}
          className="btn-gold w-full flex items-center justify-center gap-2 text-base py-4"
        >
          Enter 8Hope <ChevronRight className="w-5 h-5" />
        </button>
        <p className="text-center text-white/20 text-xs mt-4 font-body">
          "Evening and morning was the first day." — Genesis 1
        </p>
      </motion.div>

    </div>
  )
}
