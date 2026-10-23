import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ChevronRight, PenLine, Bookmark, Scale, NotebookPen, Calculator } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppShell } from '@/components/layout/AppShell'
import { PrayerWatchBanner } from '@/components/prayer/PrayerWatchBanner'
import { useAppStore } from '@/contexts/store'
import { getActiveWatch } from '@/lib/watches'
import { getHebrewDate } from '@/lib/hebrew'
import { supabase } from '@/lib/supabase'
import { BOOK_NAMES, rotatingAnchorIndex } from '@/lib/axios-content'
import { costByFeature, usd, type FixedCost, type ModelPrice, type UsageRow } from '@/lib/costs'

export function Dashboard() {
  const { user, activeWatch, setActiveWatch, setHebrewDate, dailyVerses } = useAppStore()
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
                <p className="text-gold-400/90 font-heading text-3xs font-semibold uppercase tracking-widest mb-0.5">
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

        {/* AXIOS — enabled accounts only */}
        {user?.axios_enabled && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <AxiosCard opted={!!user.axios_opted_in_at} userId={user.id} watchNumber={activeWatch?.watch_number ?? 1} />
          </motion.div>
        )}

        {/* My Bible Study — enabled accounts only */}
        {user?.bible_study_enabled && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
            <StudyCard userId={user.id} />
          </motion.div>
        )}

        {/* Count the Costs — admin only */}
        {user?.is_admin && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.29 }}>
            <CostsCard />
          </motion.div>
        )}

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

interface CardAnchor {
  title: string
  phrase: string
  word_id: string
  axios_words: { relation: 'over_me' | 'given'; given_to: string | null } | null
}

/**
 * The AXIOS card. Once the user has opted in, it also shows one rotating
 * anchor — one new anchor each day and a different one each watch, so every
 * anchor comes around even for someone who only checks at the same hour.
 */
function AxiosCard({ opted, userId, watchNumber }: { opted: boolean; userId: string; watchNumber: number }) {
  const navigate = useNavigate()
  const [anchors, setAnchors] = useState<CardAnchor[]>([])

  useEffect(() => {
    if (!opted) return
    supabase
      .from('axios_anchors')
      .select('title, phrase, word_id, axios_words(relation, given_to)')
      .eq('user_id', userId)
      .order('created_at')
      // axios_words is many-to-one, so it comes back as an object; the
      // untyped client infers an array, hence the cast.
      .then(({ data }) => setAnchors((data as unknown as CardAnchor[]) ?? []))
  }, [opted, userId])

  const anchor = anchors.length > 0 ? anchors[rotatingAnchorIndex(anchors.length, watchNumber)] : null

  return (
    <div className="card bg-gradient-to-br from-hope-dark to-hope-blue border-0 space-y-3">
      <button onClick={() => navigate('/axios')} className="w-full flex items-center justify-between group text-left">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gold-500/20 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <p className="text-gold-400/90 font-heading text-3xs font-semibold uppercase tracking-widest mb-0.5">
              Romans 8:18 · Our Anchors
            </p>
            <h3 className="text-white font-heading font-bold text-base leading-snug tracking-wide">
              AXIOS
            </h3>
            <p className="text-white/50 text-xs mt-0.5">Walk worthy of the word over you</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors shrink-0 ml-2" />
      </button>

      {anchor && (
        <button
          onClick={() => navigate(`/axios/${anchor.word_id}`)}
          className="w-full text-left rounded-xl bg-black/20 px-3 py-2.5 active:scale-[0.99] transition-transform"
        >
          <p className="text-white/60 text-3xs font-heading font-semibold uppercase tracking-wider mb-0.5">
            {anchor.axios_words?.relation === 'given'
              ? `Praying for ${anchor.axios_words.given_to ?? 'them'} · ${anchor.title}`
              : `Anchor · ${anchor.title}`}
          </p>
          <p className="text-white text-sm font-heading font-semibold leading-snug">"{anchor.phrase}"</p>
        </button>
      )}
    </div>
  )
}

/** Home card for My Bible Study: where each book picks up next. */
function StudyCard({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [next, setNext] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('study_plan_books')
      .select('book, next_chapter, next_verse, position')
      .eq('user_id', userId)
      .order('position')
      .then(({ data }) => {
        const rows = (data ?? []) as Array<{ book: string; next_chapter: number; next_verse: number }>
        setNext(rows.map((r) => `${BOOK_NAMES[r.book] ?? r.book} ${r.next_chapter}:${r.next_verse}`).join(' · ') || null)
      })
  }, [userId])

  return (
    <button
      onClick={() => navigate('/study')}
      className="w-full card flex items-center justify-between group text-left hover:shadow-md transition-all duration-200 active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gold-500/15 flex items-center justify-center shrink-0">
          <NotebookPen className="w-5 h-5 text-gold-600" />
        </div>
        <div>
          <p className="text-gold-600 font-heading text-3xs font-semibold uppercase tracking-widest mb-0.5">The Sovereign Study</p>
          <h3 className="text-hope-blue font-heading font-bold text-base leading-snug">My Bible Study</h3>
          <p className="text-hope-gray/50 text-xs mt-0.5">{next ? `Next: ${next}` : 'One page a day, no pressure'}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 transition-colors shrink-0 ml-2" />
    </button>
  )
}

/** Admin-only Home card: AI spend over the last 30 days and fixed monthly costs. */
function CostsCard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<{ ai: number; fixed: number } | null>(null)

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
    Promise.all([
      supabase.from('ai_usage').select('created_at, user_id, feature, model, input_tokens, output_tokens, thinking_tokens, ok').gte('created_at', since).limit(10000),
      supabase.from('ai_model_prices').select('*'),
      supabase.from('fixed_costs').select('*'),
    ]).then(([u, p, f]) => {
      const features = costByFeature((u.data as UsageRow[]) ?? [], (p.data as ModelPrice[]) ?? [], 0)
      setSummary({
        ai: features.reduce((s, x) => s + x.list, 0),
        fixed: ((f.data as FixedCost[]) ?? []).reduce((s, x) => s + Number(x.monthly_usd || 0), 0),
      })
    })
  }, [])

  return (
    <button
      onClick={() => navigate('/admin/costs')}
      className="w-full card flex items-center justify-between group text-left hover:shadow-md transition-all duration-200 active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-hope-blue/10 flex items-center justify-center shrink-0">
          <Calculator className="w-5 h-5 text-hope-blue" />
        </div>
        <div>
          <p className="text-gold-600 font-heading text-3xs font-semibold uppercase tracking-widest mb-0.5">Only you can see this</p>
          <h3 className="text-hope-blue font-heading font-bold text-base leading-snug">Count the Costs</h3>
          <p className="text-hope-gray/50 text-xs mt-0.5">
            {summary ? `AI, last 30 days: ${usd(summary.ai, 2)} · Fixed: ${usd(summary.fixed, 0)}/mo` : 'Loading…'}
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 transition-colors shrink-0 ml-2" />
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-3.5 rounded-full bg-gold-500" />
      <h3 className="font-heading text-3xs font-semibold text-hope-gray/50 uppercase tracking-widest">
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
