import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { formatRef, parseRef } from '@/lib/axios-content'
import type { AxiosAnchor, VerseRef } from '@/types'

export type AnchorDraft = Pick<AxiosAnchor, 'title' | 'phrase' | 'explanation' | 'verse_refs'>

interface AnchorEditorProps {
  initial?: AnchorDraft
  saving: boolean
  onSave: (draft: AnchorDraft) => void
  onCancel: () => void
}

const INPUT = `w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-body
  text-hope-gray placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-500`

export function AnchorEditor({ initial, saving, onSave, onCancel }: AnchorEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [phrase, setPhrase] = useState(initial?.phrase ?? '')
  const [explanation, setExplanation] = useState(initial?.explanation ?? '')
  const [versesText, setVersesText] = useState((initial?.verse_refs ?? []).map(formatRef).join('; '))

  const parts = versesText.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)
  const parsed = parts.map(parseRef)
  const badRef = parts.find((_, i) => !parsed[i])
  const canSave = title.trim() && phrase.trim() && !badRef && !saving

  function submit() {
    if (!canSave) return
    onSave({
      title: title.trim(),
      phrase: phrase.trim(),
      explanation: explanation.trim() || null,
      verse_refs: parsed as VerseRef[],
    })
  }

  return (
    <div className="card space-y-3 border-gold-500/30">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Anchor title (e.g. The Nehemiah Mandate)" className={INPUT} />
      <textarea value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="The line to memorize" rows={2} className={`${INPUT} resize-none`} />
      <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="What this means (optional)" rows={3} className={`${INPUT} resize-none`} />
      <div>
        <input value={versesText} onChange={(e) => setVersesText(e.target.value)} placeholder="Verses, separated by ; (e.g. Romans 8:28; Neh 2:8)" className={INPUT} />
        {badRef && <p className="text-red-500 text-xs mt-1">Couldn't read "{badRef}". Use Book Chapter:Verse.</p>}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-outline flex-1 text-sm py-2">Cancel</button>
        <button onClick={submit} disabled={!canSave} className="btn-gold flex-1 text-sm py-2 flex items-center justify-center disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Anchor'}
        </button>
      </div>
    </div>
  )
}
