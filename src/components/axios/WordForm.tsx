import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { AxiosWord } from '@/types'

export type WordDraft = Pick<AxiosWord, 'title' | 'spoken_by' | 'spoken_on' | 'full_text' | 'application'>

interface WordFormProps {
  initial?: WordDraft
  saving: boolean
  submitLabel: string
  onSave: (draft: WordDraft) => void
  onCancel: () => void
}

const INPUT = `w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-body
  text-hope-gray placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-500`

export function WordForm({ initial, saving, submitLabel, onSave, onCancel }: WordFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [spokenBy, setSpokenBy] = useState(initial?.spoken_by ?? '')
  const [spokenOn, setSpokenOn] = useState(initial?.spoken_on ?? '')
  const [fullText, setFullText] = useState(initial?.full_text ?? '')
  const [application, setApplication] = useState(initial?.application ?? '')

  function submit() {
    if (!title.trim() || saving) return
    onSave({
      title: title.trim(),
      spoken_by: spokenBy.trim() || null,
      spoken_on: spokenOn || null,
      full_text: fullText.trim() || null,
      application: application.trim() || null,
    })
  }

  return (
    <div className="card space-y-3 border-gold-500/30">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Word to AP Pam)" className={INPUT} />
      <div className="grid grid-cols-2 gap-2">
        <input value={spokenBy} onChange={(e) => setSpokenBy(e.target.value)} placeholder="Spoken by" className={INPUT} />
        <input type="date" value={spokenOn} onChange={(e) => setSpokenOn(e.target.value)} className={INPUT} />
      </div>
      <textarea value={fullText} onChange={(e) => setFullText(e.target.value)} placeholder="The word, or a transcript of it" rows={5} className={`${INPUT} resize-none`} />
      <textarea value={application} onChange={(e) => setApplication(e.target.value)} placeholder="How I will walk it out (optional)" rows={3} className={`${INPUT} resize-none`} />
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-outline flex-1 text-sm py-2">Cancel</button>
        <button onClick={submit} disabled={!title.trim() || saving} className="btn-gold flex-1 text-sm py-2 flex items-center justify-center disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
        </button>
      </div>
    </div>
  )
}
