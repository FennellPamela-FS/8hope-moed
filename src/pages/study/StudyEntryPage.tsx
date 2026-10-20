import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Loader2, BookOpen, Sparkles, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppShell } from '@/components/layout/AppShell'
import { FormattedText } from '@/components/axios/FormattedText'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'
import { BIBLE_VERSIONS_BY_LANGUAGE, fetchPassage } from '@/lib/bible'
import { localDateString } from '@/lib/axios-content'
import { formatPassage, lensClass, nextStart, SOVEREIGN_RULE, SOVEREIGN_STEPS, type SovereignStepKey } from '@/lib/study'
import type { BibleVersion, StudyEntry, StudyInsight, StudyPlan, StudyPlanBook } from '@/types'

const INPUT = `w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-body
  text-hope-gray placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-500`
const NUM = `w-16 bg-white border border-gray-200 rounded-xl px-2 py-2 text-sm font-heading text-center
  text-hope-gray focus:outline-none focus:ring-2 focus:ring-gold-500`

/** /study/new/:book (new entry) and /study/entry/:id (existing). */
export function StudyEntryPage() {
  const { user } = useAppStore()
  const { book: newBook, id } = useParams()
  if (!user?.bible_study_enabled) return <Navigate to="/" replace />
  return (
    <AppShell title="My Bible Study">
      <EntryEditor key={id ?? newBook} userId={user.id} entryId={id ?? null} newBook={newBook ?? null} />
    </AppShell>
  )
}

type Draft = Omit<StudyEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>

function EntryEditor({ userId, entryId, newBook }: { userId: string; entryId: string | null; newBook: string | null }) {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [planBook, setPlanBook] = useState<StudyPlanBook | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [knownTags, setKnownTags] = useState<string[]>([])
  const [insights, setInsights] = useState<StudyInsight[]>([])
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: plans } = await supabase.from('study_plans').select('*').eq('user_id', userId).order('created_at').limit(1)
      const p = plans?.[0] as StudyPlan | undefined
      if (!p) { setNotFound(true); return }
      setPlan(p)

      const { data: tagRows } = await supabase.from('study_entries').select('tags').eq('plan_id', p.id)
      setKnownTags([...new Set(((tagRows ?? []) as Array<{ tags: string[] }>).flatMap((r) => r.tags))].sort())

      let entry: StudyEntry | null = null
      if (entryId) {
        const { data } = await supabase.from('study_entries').select('*').eq('id', entryId).maybeSingle()
        entry = data as StudyEntry | null
        if (!entry) { setNotFound(true); return }
        const { data: ins } = await supabase.from('study_insights').select('*').eq('entry_id', entryId).order('created_at')
        setInsights((ins as StudyInsight[]) ?? [])
      }

      const bookCode = entry?.book ?? newBook
      const { data: pb } = await supabase.from('study_plan_books').select('*').eq('plan_id', p.id).eq('book', bookCode).maybeSingle()
      if (!pb) { setNotFound(true); return }
      setPlanBook(pb as StudyPlanBook)

      setDraft(entry ?? {
        plan_id: p.id,
        book: pb.book,
        entry_date: localDateString(),
        start_chapter: pb.next_chapter,
        start_verse: pb.next_verse,
        end_chapter: pb.next_chapter,
        end_verse: pb.next_verse,
        version_label: p.version_label,
        read_text: null, scribe: null, pray: null, ingest: null, lead: null, notes: null,
        tags: [],
      })
    }
    load()
  }, [userId, entryId, newBook])

  if (notFound) return <Navigate to="/study" replace />
  if (!draft || !plan || !planBook) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>
  }

  const d = draft
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...d, [key]: value })
  const validRange = d.start_chapter >= 1 && d.start_verse >= 1 && d.end_chapter >= d.start_chapter &&
    d.end_verse >= 1 && (d.end_chapter > d.start_chapter || d.end_verse >= d.start_verse) && d.end_chapter <= planBook.total_chapters

  async function save() {
    if (!validRange || !planBook) return
    setSaving(true)
    setError(null)
    const clean = (v: string | null) => (v && v.trim() ? v.trim() : null)
    const row = {
      ...d,
      read_text: clean(d.read_text), scribe: clean(d.scribe), pray: clean(d.pray),
      ingest: clean(d.ingest), lead: clean(d.lead), notes: clean(d.notes),
      user_id: userId,
      updated_at: new Date().toISOString(),
    }
    const result = entryId
      ? await supabase.from('study_entries').update(row).eq('id', entryId).select().single()
      : await supabase.from('study_entries').insert(row).select().single()
    if (result.error || !result.data) {
      setSaving(false)
      setError('Could not save. Please try again.')
      return
    }

    // Move the book's "next reading" past this one if it reached or passed it.
    const reachedPointer = d.end_chapter > planBook.next_chapter ||
      (d.end_chapter === planBook.next_chapter && d.end_verse >= planBook.next_verse)
    if (reachedPointer) {
      const next = await nextStart(d.book, d.end_chapter, d.end_verse, planBook.total_chapters)
      await supabase.from('study_plan_books').update({ next_chapter: next.chapter, next_verse: next.verse }).eq('id', planBook.id)
      setPlanBook({ ...planBook, next_chapter: next.chapter, next_verse: next.verse })
    }

    setSaving(false)
    if (!entryId) {
      navigate(`/study/entry/${result.data.id}`, { replace: true })
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function remove() {
    if (!entryId || !window.confirm('Delete this study entry and its insights? This cannot be undone.')) return
    const { error } = await supabase.from('study_entries').delete().eq('id', entryId)
    if (!error) navigate('/study', { replace: true })
  }

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Passage */}
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-3xs font-heading font-semibold text-gold-600 uppercase tracking-widest">Book & verses</p>
            <h2 className="font-heading text-xl font-bold text-hope-blue">
              {formatPassage(d.book, d.start_chapter, d.start_verse, d.end_chapter, d.end_verse)}
            </h2>
            {planBook.lens_name && (
              <span className={cn('inline-block mt-1 rounded-lg px-2 py-0.5 text-3xs font-heading font-semibold uppercase tracking-wider', lensClass(planBook.lens_name))}>
                {planBook.lens_name}{planBook.lens_focus && ` · ${planBook.lens_focus}`}
              </span>
            )}
          </div>
          {entryId && (
            <button onClick={remove} className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50" aria-label="Delete entry">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Each "chapter : verse" pair stays together when the row wraps. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-heading text-hope-gray">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-[calc(2.75rem*var(--text-scale,1))]">From</span>
            <input type="number" min={1} max={planBook.total_chapters} value={d.start_chapter} onChange={(e) => set('start_chapter', Number(e.target.value))} className={NUM} aria-label="Start chapter" />
            <span>:</span>
            <input type="number" min={1} value={d.start_verse} onChange={(e) => set('start_verse', Number(e.target.value))} className={NUM} aria-label="Start verse" />
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-[calc(2.75rem*var(--text-scale,1))]">to</span>
            <input type="number" min={1} max={planBook.total_chapters} value={d.end_chapter} onChange={(e) => set('end_chapter', Number(e.target.value))} className={NUM} aria-label="End chapter" />
            <span>:</span>
            <input type="number" min={1} value={d.end_verse} onChange={(e) => set('end_verse', Number(e.target.value))} className={NUM} aria-label="End verse" />
          </span>
        </div>
        {!validRange && <p className="text-red-500 text-xs">Check the verses — the end should come after the start.</p>}

        <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(calc(8rem*var(--text-scale,1)),1fr))]">
          <label className="text-xs font-heading text-hope-gray/60">
            Date
            <input type="date" value={d.entry_date} onChange={(e) => set('entry_date', e.target.value)} className={`${INPUT} mt-1`} />
          </label>
          <label className="text-xs font-heading text-hope-gray/60">
            Version you read
            <input value={d.version_label} onChange={(e) => set('version_label', e.target.value)} className={`${INPUT} mt-1`} />
          </label>
        </div>

        <PassageReference book={d.book} sc={d.start_chapter} sv={d.start_verse} ec={d.end_chapter} ev={d.end_verse} readingVersion={d.version_label} enabled={validRange} />
      </div>

      {/* The Sovereign Study — every step optional */}
      <div className="space-y-3">
        <p className="text-hope-gray/50 text-xs font-body text-center">Every step is optional — write what you're led to.</p>
        {SOVEREIGN_STEPS.map((step) => (
          <div key={step.key} className="card space-y-2">
            <div>
              <h3 className="font-heading font-bold text-hope-blue text-sm">{step.title} <span className="font-semibold text-hope-gray/50">· {step.subtitle}</span></h3>
              <p className="text-hope-gray/50 text-xs font-body">{step.prompt}</p>
            </div>
            <textarea
              value={d[step.key as SovereignStepKey] ?? ''}
              onChange={(e) => set(step.key as SovereignStepKey, e.target.value)}
              rows={step.key === 'ingest' ? 2 : 4}
              className={`${INPUT} resize-y`}
              aria-label={`${step.title} ${step.subtitle}`}
            />
          </div>
        ))}

        <div className="card space-y-2">
          <h3 className="font-heading font-bold text-hope-blue text-sm">Free notes</h3>
          <textarea value={d.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={4} className={`${INPUT} resize-y`} placeholder="Anything else — no template needed." aria-label="Free notes" />
        </div>

        <TagEditor tags={d.tags} known={knownTags} onChange={(tags) => set('tags', tags)} />
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <button onClick={save} disabled={!validRange || saving} className="btn-gold w-full flex items-center justify-center disabled:opacity-40">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? '✓ Saved' : entryId ? 'Save changes' : 'Save entry'}
      </button>

      {/* Ask for insight — only once the entry exists */}
      {entryId ? (
        <InsightPanel entryId={entryId} insights={insights} onAdded={(i) => setInsights((list) => [...list, i])} />
      ) : (
        <p className="text-hope-gray/40 text-xs text-center font-body">Save the entry to ask for an Eagle and Lion insight.</p>
      )}

      <p className="text-center text-hope-gray/40 text-xs font-body italic px-4">{SOVEREIGN_RULE}</p>
    </div>
  )
}

/** Optional reference text — the app can't show the MEV, so it's labeled. */
function PassageReference({ book, sc, sv, ec, ev, readingVersion, enabled }: {
  book: string; sc: number; sv: number; ec: number; ev: number; readingVersion: string; enabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState<BibleVersion>('KJV')
  const [passage, setPassage] = useState<{ ref: string; text: string } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open || !enabled) return
    let cancelled = false
    setPassage(null)
    setFailed(false)
    fetchPassage(book, sc, sv, ec, ev, version)
      .then((p) => { if (!cancelled) setPassage(p) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [open, enabled, book, sc, sv, ec, ev, version])

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} disabled={!enabled} className="flex items-center gap-1.5 text-left text-xs font-heading font-semibold text-gold-600 disabled:opacity-40">
        <BookOpen className="w-3.5 h-3.5" /> {open ? 'Hide passage' : 'Show passage for reference'}
      </button>
      {open && (
        <div className="mt-2 rounded-xl bg-hope-light border border-gray-100 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-3xs font-heading font-semibold text-hope-gray/50 uppercase tracking-wider">
              Shown in {version} · you're reading the {readingVersion}
            </p>
            <select value={version} onChange={(e) => setVersion(e.target.value as BibleVersion)} className="text-xs font-heading border border-gray-200 rounded-lg px-1.5 py-1 bg-white" aria-label="Reference version">
              {BIBLE_VERSIONS_BY_LANGUAGE.en.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          {passage ? (
            <p className="text-hope-gray text-sm font-body leading-relaxed whitespace-pre-line">{passage.text}</p>
          ) : failed ? (
            <p className="text-hope-gray/50 text-sm">Unable to load this passage.</p>
          ) : (
            <Loader2 className="w-4 h-4 text-gold-500 animate-spin" />
          )}
        </div>
      )}
    </div>
  )
}

/** Word Watch tags: recurring words to follow across passages. */
function TagEditor({ tags, known, onChange }: { tags: string[]; known: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')
  const suggestions = known.filter((t) => !tags.includes(t))

  function add(raw: string) {
    const t = raw.trim().toLowerCase()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }

  return (
    <div className="card space-y-2">
      <div>
        <h3 className="font-heading font-bold text-hope-blue text-sm">Word Watch</h3>
        <p className="text-hope-gray/50 text-xs font-body">Tag words you're following — like "immediately", "find / found", "filled".</p>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-hope-blue text-white px-2.5 py-1 text-xs font-heading font-semibold">
              {t}
              <button onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) } }}
        onBlur={() => input && add(input)}
        placeholder="Add a word and press Enter"
        className={INPUT}
        aria-label="Add a Word Watch tag"
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((t) => (
            <button key={t} onClick={() => add(t)} className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-heading text-hope-gray/70">+ {t}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function InsightPanel({ entryId, insights, onAdded }: { entryId: string; insights: StudyInsight[]; onAdded: (i: StudyInsight) => void }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ask() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.functions.invoke<{ insight: StudyInsight }>('study-insight', {
      body: { entry_id: entryId, question: question.trim() || undefined },
    })
    setLoading(false)
    if (error || !data?.insight) {
      setError('The insight could not be written right now. Please try again in a moment.')
      return
    }
    onAdded(data.insight)
    setQuestion('')
  }

  return (
    <div className="space-y-3">
      {insights.map((i) => (
        <div key={i.id} className="card space-y-3">
          {i.question && <p className="text-hope-gray/60 text-xs font-body italic">You asked: "{i.question}"</p>}
          <div>
            <p className="text-3xs font-heading font-semibold text-hope-blue uppercase tracking-widest mb-1">Eagle Insight · Theological Vision</p>
            <FormattedText text={i.eagle} />
          </div>
          <div>
            <p className="text-3xs font-heading font-semibold text-gold-700 uppercase tracking-widest mb-1">Lion Insight · Practical Application</p>
            <FormattedText text={i.lion} />
          </div>
        </div>
      ))}

      <div className="card space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-600" />
          <h3 className="font-heading font-bold text-hope-blue text-sm">Ask for insight</h3>
        </div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder={`A question about this passage (optional), e.g. "What does 'Corban' mean in verse 11?"`}
          className={`${INPUT} resize-none`}
          aria-label="Question for the insight"
        />
        <button onClick={ask} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-hope-blue text-white text-sm font-heading font-semibold disabled:opacity-60">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing your insight…</> : 'Get Eagle & Lion insight'}
        </button>
        {loading && <p className="text-center text-hope-gray/40 text-2xs">This can take up to a minute.</p>}
        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
      </div>
    </div>
  )
}

