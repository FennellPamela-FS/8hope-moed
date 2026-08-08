import { motion } from 'framer-motion'
import { Clock, BookOpen, Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LandingProps {
  onEnter: () => void
}

const FEATURES = [
  {
    icon: Clock,
    num: '01',
    title: 'Your Divine Watch',
    body: 'Discover which of the 8 biblical prayer watches aligns with when God calls you to pray.',
  },
  {
    icon: BookOpen,
    num: '02',
    title: 'The Moed Meditation',
    body: 'Three daily scriptures from Psalms, Proverbs, and the New Testament — fresh every morning.',
  },
  {
    icon: Sparkles,
    num: '03',
    title: 'Deep Study',
    body: 'Unlock the original Hebrew and Greek meaning behind each verse with AI-guided revelation.',
  },
]

export function Landing({ onEnter }: LandingProps) {
  return (
    <div className="min-h-screen bg-hope-dark flex flex-col relative overflow-x-hidden">

      {/* Ambient glow layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem]
                        rounded-full bg-gold-500/5 blur-[90px]" />
        <div className="absolute bottom-0 left-0 right-0 h-72
                        bg-gradient-to-t from-hope-blue/20 to-transparent" />
      </div>

      {/* Large decorative numeral */}
      <div className="pointer-events-none absolute -top-4 right-0 select-none overflow-hidden">
        <span className="font-heading font-black leading-none text-white/[0.025]"
              style={{ fontSize: '22rem' }}>
          8
        </span>
      </div>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center
                      text-center px-6 pt-20 pb-8">

        {/* Top gold rule */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.75 }}
          className="w-8 h-[1.5px] bg-gold-500/70 mb-8 rounded-full"
        />

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15 }}
        >
          <h1
            className="font-heading font-black text-gradient-gold leading-none tracking-tight"
            style={{ fontSize: 'clamp(4rem, 20vw, 6rem)' }}
          >
            8Hope
          </h1>
          <p className="text-white/25 font-heading uppercase tracking-[0.45em] mt-2"
             style={{ fontSize: '9px' }}>
            Sacred Prayer Watches
          </p>
        </motion.div>

        {/* Pull quote */}
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          className="mt-8 max-w-[17rem]"
        >
          <p className="text-white/50 font-body text-[15px] italic leading-[1.75]">
            "Have you ever woken at 3am, 4am, or an unusual hour — and wondered why?"
          </p>
          <p className="text-gold-500/60 font-heading font-semibold mt-4 not-italic tracking-wide"
             style={{ fontSize: '11px' }}>
            The Bible reveals the answer.
          </p>
        </motion.blockquote>

        {/* Bottom gold rule */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.65, duration: 0.75 }}
          className="w-8 h-[1.5px] bg-gold-500/70 mt-8 rounded-full"
        />
      </div>

      {/* Feature list */}
      <div className="relative z-10 px-6 pb-5">
        {FEATURES.map(({ icon: Icon, num, title, body }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
            className={cn(
              'flex items-start gap-3.5 py-4',
              i < FEATURES.length - 1 && 'border-b border-white/[0.07]',
            )}
          >
            <span className="font-heading font-bold text-gold-500/35 pt-0.5 w-5 shrink-0 text-center"
                  style={{ fontSize: '10px' }}>
              {num}
            </span>
            <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/15
                            flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-gold-400" />
            </div>
            <div>
              <p className="font-heading font-semibold text-white/90 text-sm leading-snug">{title}</p>
              <p className="text-white/35 font-body text-xs leading-relaxed mt-0.5">{body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="relative z-10 px-6 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.4 }}
        >
          <button
            onClick={onEnter}
            className="group w-full flex items-center justify-center gap-2
                       bg-gold-500 hover:bg-gold-600 active:scale-[0.98]
                       text-white font-heading font-bold text-base tracking-wide
                       px-6 py-4 rounded-2xl
                       transition-all duration-200"
            style={{ boxShadow: '0 6px 24px rgba(201,168,76,0.28)' }}
          >
            Begin Your Watch
            <ChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>

          <p className="text-center text-white/20 font-body mt-5" style={{ fontSize: '11px' }}>
            "Evening and morning was the first day." — Genesis 1
          </p>
        </motion.div>
      </div>

    </div>
  )
}
