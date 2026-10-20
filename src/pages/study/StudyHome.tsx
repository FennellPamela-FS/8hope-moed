import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Check, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppShell } from '@/components/layout/AppShell'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'
import { BOOK_NAMES, localDateString } from '@/lib/axios-content'
import { formatPassage, lensClass, SOVEREIGN_RULE } from '@/lib/study'
import type { StudyEntry, StudyPlan, StudyPlanBook } from '@/types'

export function StudyHome() {
  const { user } = useAppStore()
  if (!user?.bible_study_enabled) return <Navigate to="/" replace />
  return (
    <AppShell title="My Bible Study">
      <StudyContent userId={user.id} />
    </AppShell>
  )
}

function StudyContent({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<StudyPlan | null | undefined>(undefined)
  const [books, setBooks] = useState<StudyPlanBook[]>([])
  const [entries, setEntries] = useState<StudyEntry[]>([])
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: plans } = await supabase.from('study_plans').select('*').eq('user_id', userId).order('created_at').limit(1)
      const p = (plans?.[0] as StudyPlan | undefined) ?? null
      setPlan(p)
      if (!p) return
      const [b, e] = await Promise.all([
        supabase.from('study_plan_books').select('*').eq('plan_id', p.id).order('position'),
        supabase.from('study_entries').select('*').eq('plan_id', p.id).order('entry_date', { ascending: false }).order('created_at', { ascending: false }),
      ])
      setBooks((b.data as StudyPlanBook[]) ?? [])
      setEntries((e.data as StudyEntry[]) ?? [])
    }
    load()
  }, [userId])

  if (plan === undefined) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>
  }
  if (!plan) {
    return <p className="px-4 py-10 text-center text-hope-gray/60 text-sm">No study plan yet.</p>
  }

  const today = localDateString()
  const tagCounts = new Map<string, number>()
  for (const e of entries) for (const t of e.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const shown = tagFilter ? entries.filter((e) => e.tags.includes(tagFilter)) : entries

  return (
    <div className="px-4 py-5 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-gold-500 font-heading text-xs font-semibold uppercase tracking-widest mb-1">The Sovereign Study</p>
        <h2 className="font-heading text-2xl font-bold text-hope-blue">{plan.title}</h2>
        <p className="text-hope-gray/60 text-sm mt-1">Reading the {plan.version_label} · one page a day, no pressure</p>
      </motion.div>

      {/* Today */}
      <div className="space-y-3">
        <SectionLabel>Today</SectionLabel>
        {books.map((b) => {
          const todays = entries.find((e) => e.book === b.book && e.entry_date === today)
          const read = Math.min(b.next_chapter - 1, b.total_chapters)
          return (
            <div key={b.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-hope-blue">{BOOK_NAMES[b.book] ?? b.book}</h3>
                  {b.lens_name && (
                    <span className={cn('inline-block mt-1 rounded-lg px-2 py-0.5 text-3xs font-heading font-semibold uppercase tracking-wider', lensClass(b.lens_name))}>
                      {b.lens_name}{b.lens_focus && ` · ${b.lens_focus}`}
                    </span>
                  )}
                </div>
                <p className="text-hope-gray/50 text-xs font-heading shrink-0">{read}/{b.total_chapters} ch.</p>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
                <div className="h-full bg-gold-500 rounded-full" style={{ width: `${(read / b.total_chapters) * 100}%` }} />
              </div>
              {todays ? (
                <button onClick={() => navigate(`/study/entry/${todays.id}`)} className="w-full flex items-center justify-between rounded-xl bg-hope-green/10 px-3 py-2.5 text-left">
                  <span className="flex items-center gap-2 text-sm font-heading font-semibold text-hope-green">
                    <Check className="w-4 h-4" /> Logged today · {formatPassage(todays.book, todays.start_chapter, todays.start_verse, todays.end_chapter, todays.end_verse)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-hope-green/60" />
                </button>
              ) : (
                <button onClick={() => navigate(`/study/new/${b.book}`)} className="btn-gold w-full flex items-center justify-center gap-2 text-sm py-2.5">
                  <Plus className="w-4 h-4" /> Log today's reading · from {BOOK_NAMES[b.book] ?? b.book} {b.next_chapter}:{b.next_verse}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Word Watch */}
      {tags.length > 0 && (
        <div>
          <SectionLabel>Word Watch</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {tags.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => setTagFilter((t) => (t === tag ? null : tag))}
                aria-pressed={tagFilter === tag}
                className={cn('rounded-full px-3 py-1 text-xs font-heading font-semibold border transition-colors',
                  tagFilter === tag ? 'bg-hope-blue text-white border-hope-blue' : 'bg-white text-hope-gray border-gray-200')}
              >
                {tag} <span className="opacity-60">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2">
        <SectionLabel>{tagFilter ? `Passages with "${tagFilter}"` : 'Your study'}</SectionLabel>
        {shown.length === 0 ? (
          <p className="text-hope-gray/50 text-sm font-body">Your entries will appear here as you study.</p>
        ) : (
          shown.map((e) => {
            const lead = e.ingest || e.scribe || e.notes || e.pray || e.lead
            return (
              <button key={e.id} onClick={() => navigate(`/study/entry/${e.id}`)} className="w-full card text-left flex items-start justify-between gap-3 hover:shadow-md transition-all">
                <div className="min-w-0">
                  <p className="text-3xs font-heading font-semibold text-hope-gray/50 uppercase tracking-wider">
                    {new Date(e.entry_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {e.version_label}
                  </p>
                  <p className="font-heading font-bold text-hope-blue text-sm">{formatPassage(e.book, e.start_chapter, e.start_verse, e.end_chapter, e.end_verse)}</p>
                  {lead && <p className="text-hope-gray/70 text-xs font-body line-clamp-2 mt-0.5">{lead}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
              </button>
            )
          })
        )}
      </div>

      <p className="text-center text-hope-gray/40 text-xs font-body italic px-4">{SOVEREIGN_RULE}</p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-3.5 rounded-full bg-gold-500" />
      <h3 className="font-heading text-3xs font-semibold text-hope-gray/50 uppercase tracking-widest">{children}</h3>
    </div>
  )
}
