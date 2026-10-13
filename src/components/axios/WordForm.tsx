import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AxiosWord, AxiosWordRelation } from '@/types'

export type WordDraft = Pick<AxiosWord, 'title' | 'relation' | 'given_to' | 'spoken_by' | 'spoken_on' | 'full_text' | 'application'>

interface WordFormProps {
  initial?: WordDraft
  saving: boolean
  submitLabel: string
  onSave: (draft: WordDraft) => void
  onCancel: () => void
}

const RELATIONS: Array<{ value: AxiosWordRelation; label: string }> = [
  { value: 'over_me', label: 'Spoken over me' },
  { value: 'given',   label: 'A word I gave' },
]

const INPUT = `w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-body
  text-hope-gray placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-500`

export function WordForm({ initial, saving, submitLabel, onSave, onCancel }: WordFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [relation, setRelation] = useState<AxiosWordRelation>(initial?.relation ?? 'over_me')
  const [givenTo, setGivenTo] = useState(initial?.given_to ?? '')
  const [spokenBy, setSpokenBy] = useState(initial?.spoken_by ?? '')
  const [spokenOn, setSpokenOn] = useState(initial?.spoken_on ?? '')
  const [fullText, setFullText] = useState(initial?.full_text ?? '')
  const [application, setApplication] = useState(initial?.application ?? '')

  function submit() {
    if (!title.trim() || saving) return
    onSave({
      title: title.trim(),
      relation,
      given_to: relation === 'given' ? givenTo.trim() || null : null,
      spoken_by: spokenBy.trim() || null,
      spoken_on: spokenOn || null,
      full_text: fullText.trim() || null,
      application: application.trim() || null,
    })
  }

  return (
    <div className="card space-y-3 border-gold-500/30">
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100" role="radiogroup" aria-label="Whose word is this?">
        {RELATIONS.map((r) => (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={relation === r.value}
            onClick={() => setRelation(r.value)}
            className={cn(
              'py-2 rounded-lg text-xs font-heading font-semibold transition-colors',
              relation === r.value ? 'bg-white text-hope-blue shadow-sm' : 'text-hope-gray/50',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Word to AP Pam)" className={INPUT} />
      {/* Side by side normally; stacks once larger text makes them too narrow. */}
      <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(calc(9rem*var(--text-scale,1)),1fr))]">
        {relation === 'given' ? (
          <input value={givenTo} onChange={(e) => setGivenTo(e.target.value)} placeholder="Given to (e.g. Dr. Anita)" className={INPUT} />
        ) : (
          <input value={spokenBy} onChange={(e) => setSpokenBy(e.target.value)} placeholder="Spoken by" className={INPUT} />
        )}
        <input type="date" value={spokenOn} onChange={(e) => setSpokenOn(e.target.value)} className={INPUT} />
      </div>
      <textarea value={fullText} onChange={(e) => setFullText(e.target.value)} placeholder="The word, or a transcript of it" rows={5} className={`${INPUT} resize-none`} />
      <textarea
        value={application}
        onChange={(e) => setApplication(e.target.value)}
        placeholder={relation === 'given' ? 'How they will walk it out, or how I will support them (optional)' : 'How I will walk it out (optional)'}
        rows={3}
        className={`${INPUT} resize-none`}
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-outline flex-1 text-sm py-2">Cancel</button>
        <button onClick={submit} disabled={!title.trim() || saving} className="btn-gold flex-1 text-sm py-2 flex items-center justify-center disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
        </button>
      </div>
    </div>
  )
}
