import { useEffect, useState } from 'react'
import { Loader2, Check, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Language } from '@/types'

type Section = 'reflection' | 'deep_study'
type Verdict = 'approve' | 'changes'

interface Review {
  reviewer_id: string
  section: Section
  verdict: Verdict
  comment: string | null
}

const SECTIONS: Array<{ key: Section; label: string }> = [
  { key: 'reflection', label: 'Reflection' },
  { key: 'deep_study', label: 'Deeper Word Study' },
]

interface MoedExtrasReviewProps {
  userId: string
  month: number
  day: number
  language: Language
}

/**
 * Reviewer-only panel (Pamela, Dr. Anita) shown at the bottom of the Moed
 * page while Reflection + Deeper Word Study are unreleased. One verdict and
 * comment per section per day; reviewers see each other's feedback.
 */
export function MoedExtrasReview({ userId, month, day, language }: MoedExtrasReviewProps) {
  const [reviews, setReviews] = useState<Review[] | null>(null)

  useEffect(() => {
    supabase
      .from('moed_extras_reviews')
      .select('reviewer_id, section, verdict, comment')
      .eq('month', month)
      .eq('day', day)
      .eq('language', language)
      .then(({ data }) => setReviews((data as Review[]) ?? []))
  }, [month, day, language])

  if (!reviews) return null

  return (
    <div className="card border-2 border-dashed border-gold-500/40 space-y-4">
      <div>
        <p className="text-3xs font-heading font-semibold text-gold-600 uppercase tracking-widest">Reviewers only</p>
        <h3 className="font-heading font-bold text-hope-blue">Review today's new sections</h3>
        <p className="text-hope-gray/60 text-xs font-body mt-0.5">
          Only you and the other reviewer can see these sections and this feedback. They reach everyone only after you approve.
        </p>
      </div>
      {SECTIONS.map((s) => (
        <SectionReview
          key={s.key}
          label={s.label}
          section={s.key}
          mine={reviews.find((r) => r.section === s.key && r.reviewer_id === userId) ?? null}
          others={reviews.filter((r) => r.section === s.key && r.reviewer_id !== userId)}
          onSaved={(r) => setReviews((list) => [...(list ?? []).filter((x) => !(x.section === r.section && x.reviewer_id === userId)), r])}
          ids={{ userId, month, day, language }}
        />
      ))}
    </div>
  )
}

function SectionReview({ label, section, mine, others, onSaved, ids }: {
  label: string
  section: Section
  mine: Review | null
  others: Review[]
  onSaved: (r: Review) => void
  ids: { userId: string; month: number; day: number; language: Language }
}) {
  const [verdict, setVerdict] = useState<Verdict | null>(mine?.verdict ?? null)
  const [comment, setComment] = useState(mine?.comment ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)

  async function save() {
    if (!verdict) return
    setSaving(true)
    setError(false)
    const row = {
      reviewer_id: ids.userId,
      month: ids.month,
      day: ids.day,
      language: ids.language,
      section,
      verdict,
      comment: comment.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .from('moed_extras_reviews')
      .upsert(row, { onConflict: 'reviewer_id,month,day,language,section' })
    setSaving(false)
    if (error) { setError(true); return }
    onSaved({ reviewer_id: ids.userId, section, verdict, comment: row.comment })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-2 border-t border-gray-100 pt-3">
      <p className="font-heading font-semibold text-hope-blue text-sm">{label}</p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={`${label} verdict`}>
        <button
          role="radio"
          aria-checked={verdict === 'approve'}
          onClick={() => setVerdict('approve')}
          className={cn('flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-heading font-semibold border',
            verdict === 'approve' ? 'bg-hope-green text-white border-hope-green' : 'bg-white text-hope-gray border-gray-200')}
        >
          <Check className="w-4 h-4" /> Approve
        </button>
        <button
          role="radio"
          aria-checked={verdict === 'changes'}
          onClick={() => setVerdict('changes')}
          className={cn('flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-heading font-semibold border',
            verdict === 'changes' ? 'bg-gold-500 text-white border-gold-500' : 'bg-white text-hope-gray border-gray-200')}
        >
          <PenLine className="w-4 h-4" /> Needs changes
        </button>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={verdict === 'changes' ? 'What should change?' : 'Comment (optional)'}
        rows={2}
        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-body text-hope-gray
                   placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
      />
      <button onClick={save} disabled={!verdict || saving} className="btn-outline w-full text-sm py-2 flex items-center justify-center disabled:opacity-40">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? '✓ Saved' : mine ? 'Update feedback' : 'Save feedback'}
      </button>
      {error && <p className="text-red-500 text-xs text-center">Could not save. Please try again.</p>}
      {others.map((o, i) => (
        <p key={i} className="text-xs font-body text-hope-gray/70">
          <span className="font-heading font-semibold">Other reviewer:</span>{' '}
          {o.verdict === 'approve' ? 'Approved' : 'Needs changes'}{o.comment ? ` — "${o.comment}"` : ''}
        </p>
      ))}
    </div>
  )
}
