import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronDown, Plus, Loader2, Lock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { BibleVersionPicker } from '@/components/meditation/BibleVersionPicker'
import { ScriptureVerse } from '@/components/axios/ScriptureVerse'
import { WalkCheckin } from '@/components/axios/WalkCheckin'
import { WordForm, type WordDraft } from '@/components/axios/WordForm'
import { ConfirmDeleteDialog } from '@/components/axios/ConfirmDeleteDialog'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'
import { fetchChapter } from '@/lib/bible'
import { AXIOS_BASE_CHAPTER, AXIOS_EQUATION_PARTS, AXIOS_FOUNDATION } from '@/lib/axios-content'
import type { AxiosWord } from '@/types'

export function AxiosHome() {
  const { user } = useAppStore()

  if (!user?.axios_enabled) return <Navigate to="/" replace />

  return (
    <AppShell title="AXIOS">
      {user.axios_opted_in_at ? <AxiosContent userId={user.id} /> : <OptIn />}
    </AppShell>
  )
}

// ─── Opt-in ──────────────────────────────────────────────────────────────────

function OptIn() {
  const { user, setUser } = useAppStore()
  const [saving, setSaving] = useState(false)

  async function optIn() {
    if (!user) return
    setSaving(true)
    const opted = new Date().toISOString()
    const { error } = await supabase.from('user_profiles').update({ axios_opted_in_at: opted }).eq('id', user.id)
    setSaving(false)
    if (!error) setUser({ ...user, axios_opted_in_at: opted })
  }

  return (
    <div className="px-4 py-8 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-gold-500 font-heading text-xs font-semibold uppercase tracking-widest mb-1">Welcome to</p>
        <h2 className="font-heading text-4xl font-bold text-hope-blue tracking-wide">AXIOS</h2>
        <p className="text-hope-gray/60 text-sm mt-2 font-body">Walk worthy of the calling.</p>
      </motion.div>

      <ScriptureVerse verseRef={AXIOS_FOUNDATION[0]} label={AXIOS_FOUNDATION[0].label} />

      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gold-600" />
          <h3 className="font-heading font-bold text-hope-blue text-sm">Your words stay private</h3>
        </div>
        <p className="text-hope-gray/80 text-sm font-body leading-relaxed">
          AXIOS keeps the personal, prophetic words spoken over you — the full word, its anchors, the
          Scriptures behind them, and your daily walk. Only you can see them. You can opt out or delete
          everything at any time.
        </p>
        <button onClick={optIn} disabled={saving} className="btn-gold w-full flex items-center justify-center disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'I opt in'}
        </button>
      </div>
    </div>
  )
}

// ─── Main content ────────────────────────────────────────────────────────────

function AxiosContent({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [words, setWords] = useState<AxiosWord[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('axios_words')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setWords((data as AxiosWord[]) ?? []))
  }, [userId])

  async function addWord(draft: WordDraft) {
    setSaving(true)
    const { data, error } = await supabase
      .from('axios_words')
      .insert({ ...draft, user_id: userId })
      .select()
      .single()
    setSaving(false)
    if (error || !data) return
    setAdding(false)
    navigate(`/axios/${data.id}`)
  }

  return (
    <div className="px-4 py-5 space-y-5">

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h2 className="font-heading text-3xl font-bold text-hope-blue tracking-wide">AXIOS</h2>
        <p className="text-hope-gray/60 text-sm mt-1 font-body">
          Worthy · of equal weight — Romans 8 is our base
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <BibleVersionPicker />
      </motion.div>

      {/* Foundation */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
        {AXIOS_FOUNDATION.map((ref) => (
          <ScriptureVerse key={`${ref.book}${ref.chapter}${ref.verse}`} verseRef={ref} label={ref.label} />
        ))}
      </motion.div>

      {/* Equation */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <EquationCard />
      </motion.div>

      {/* Romans 8 */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <BaseChapter />
      </motion.div>

      {/* Words */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
        <SectionLabel>Words Over Me</SectionLabel>
        {words === null ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-gold-500 animate-spin" /></div>
        ) : (
          words.map((w) => (
            <button
              key={w.id}
              onClick={() => navigate(`/axios/${w.id}`)}
              className="w-full card flex items-center justify-between group text-left hover:shadow-md transition-all active:scale-[0.99]"
            >
              <div className="min-w-0">
                <p className="font-heading font-bold text-hope-blue text-sm">{w.title}</p>
                {(w.spoken_by || w.spoken_on) && (
                  <p className="text-hope-gray/50 text-xs mt-0.5">
                    {[w.spoken_by, w.spoken_on && new Date(w.spoken_on + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]
                      .filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 shrink-0 ml-2" />
            </button>
          ))
        )}

        {adding ? (
          <WordForm saving={saving} submitLabel="Add Word" onSave={addWord} onCancel={() => setAdding(false)} />
        ) : (
          <button onClick={() => setAdding(true)} className="btn-outline w-full flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add a word
          </button>
        )}
      </motion.div>

      {/* Walk it out */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SectionLabel>Walk It Out</SectionLabel>
        <WalkCheckin userId={userId} />
      </motion.div>

      <PrivacyControls userId={userId} />
    </div>
  )
}

function EquationCard() {
  return (
    <div className="card bg-gradient-to-br from-hope-blue to-hope-blue/85 border-0 text-white space-y-4">
      <div className="text-center">
        <p className="text-gold-400/90 font-heading text-[10px] font-semibold uppercase tracking-widest mb-2">The AXIOS Equation</p>
        <p className="font-heading text-2xl font-bold tracking-wide text-gradient-gold">
          AXIOS = Hs(S ≡ L) → G<sub className="text-base">T</sub>
        </p>
      </div>
      <dl className="space-y-3">
        {AXIOS_EQUATION_PARTS.map((p) => (
          <div key={p.symbol}>
            <dt className="font-heading text-sm font-semibold">
              <span className="text-gold-400">
                {p.symbol.includes('_') ? <>{p.symbol.split('_')[0]}<sub>{p.symbol.split('_')[1]}</sub></> : p.symbol}
              </span>
              <span className="text-white/60"> · {p.name}</span>
            </dt>
            <dd className="text-white/75 text-xs font-body leading-relaxed mt-0.5">{p.meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function BaseChapter() {
  const { bibleVersion } = useAppStore()
  const [open, setOpen] = useState(false)
  const [chapter, setChapter] = useState<{ ref: string; text: string } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setChapter(null)
    setFailed(false)
    fetchChapter(AXIOS_BASE_CHAPTER.book, AXIOS_BASE_CHAPTER.chapter, bibleVersion)
      .then((c) => { if (!cancelled) setChapter(c) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [open, bibleVersion])

  return (
    <div className="card">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-left">
        <div>
          <p className="text-[10px] font-heading font-semibold text-gold-600 uppercase tracking-widest">Our Base</p>
          <h3 className="font-heading font-bold text-hope-blue text-sm">Read Romans 8</h3>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {chapter ? (
            <p className="font-body text-hope-gray text-sm leading-relaxed whitespace-pre-line">{chapter.text}</p>
          ) : failed ? (
            <p className="text-hope-gray/50 text-sm">Unable to load Romans 8. Please check your connection.</p>
          ) : (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-gold-500 animate-spin" /></div>
          )}
        </div>
      )}
    </div>
  )
}

function PrivacyControls({ userId }: { userId: string }) {
  const { user, setUser } = useAppStore()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function optOut(deleteData: boolean) {
    if (!user) return
    // Deleting is confirmed by the type-DELETE dialog before we get here.
    if (!deleteData && !window.confirm('Opt out of AXIOS? Your words stay saved privately and come back if you opt in again.')) return
    setBusy(true)
    if (deleteData) {
      const [words, checkins] = await Promise.all([
        supabase.from('axios_words').delete().eq('user_id', userId),
        supabase.from('axios_checkins').delete().eq('user_id', userId),
      ])
      if (words.error || checkins.error) {
        setBusy(false)
        window.alert('Could not delete everything. Please try again.')
        return
      }
    }
    const { error } = await supabase.from('user_profiles').update({ axios_opted_in_at: null }).eq('id', userId)
    setBusy(false)
    if (error) return
    setUser({ ...user, axios_opted_in_at: null })
    navigate('/')
  }

  return (
    <div className="pt-4 border-t border-gray-200 flex flex-col items-center gap-2 text-xs font-heading">
      <button onClick={() => optOut(false)} disabled={busy} className="text-hope-gray/50 hover:text-hope-gray">Opt out of AXIOS</button>
      <button onClick={() => setConfirmingDelete(true)} disabled={busy} className="text-red-400 hover:text-red-600">Delete all my AXIOS data</button>

      {confirmingDelete && (
        <ConfirmDeleteDialog
          title="Delete all your AXIOS data?"
          items={[
            'Every word saved over you',
            'All anchors and their verses',
            'All 7-day meditation guides',
            'Your flashcard progress',
            'Your full walk check-in history',
          ]}
          busy={busy}
          onConfirm={() => optOut(true)}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
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
