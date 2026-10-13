import { useState } from 'react'
import { Loader2, Wand2, Pencil, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { formatRef } from '@/lib/axios-content'
import { AnchorEditor, type AnchorDraft } from './AnchorEditor'
import { FormattedText } from './FormattedText'
import type { AxiosAnchor } from '@/types'

interface SuggestAnchorsProps {
  wordId: string
  userId: string
  nextPosition: number
  onAdded: (anchors: AxiosAnchor[]) => void
}

interface Draft extends AnchorDraft {
  key: number
  keep: boolean
}

const ERROR_MESSAGES: Record<string, string> = {
  no_text: 'Paste the word into this word\'s text first (tap the pencil above), then try again.',
}

/**
 * "Pull anchors from this word": AI suggests anchors from the pasted word;
 * nothing is saved until the user keeps them.
 */
export function SuggestAnchors({ wordId, userId, nextPosition, onAdded }: SuggestAnchorsProps) {
  const [drafts, setDrafts] = useState<Draft[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingKey, setEditingKey] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)

  async function pull() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.functions.invoke<{ anchors: AnchorDraft[]; truncated: boolean }>('axios-suggest-anchors', {
      body: { word_id: wordId },
    })
    setLoading(false)
    if (error || !data?.anchors) {
      let code = ''
      try { code = (await (error as { context?: Response })?.context?.json())?.error ?? '' } catch { /* not JSON */ }
      setError(ERROR_MESSAGES[code] ?? 'Anchors could not be pulled right now. Please try again in a moment.')
      return
    }
    setTruncated(data.truncated)
    setDrafts(data.anchors.map((a, i) => ({ ...a, key: i, keep: true })))
  }

  async function keepSelected() {
    if (!drafts) return
    const chosen = drafts.filter((d) => d.keep)
    if (chosen.length === 0) return
    setSaving(true)
    const { data, error } = await supabase
      .from('axios_anchors')
      .insert(chosen.map((d, i) => ({
        word_id: wordId,
        user_id: userId,
        position: nextPosition + i,
        title: d.title,
        phrase: d.phrase,
        explanation: d.explanation || null,
        verse_refs: d.verse_refs,
      })))
      .select()
    setSaving(false)
    if (error || !data) {
      setError('Could not save the anchors. Please try again.')
      return
    }
    onAdded(data as AxiosAnchor[])
    setDrafts(null)
  }

  if (!drafts) {
    return (
      <div className="space-y-2">
        <button
          onClick={pull}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-hope-blue text-white
                     text-sm font-heading font-semibold disabled:opacity-60"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading your word…</> : <><Wand2 className="w-4 h-4" /> Pull anchors from this word</>}
        </button>
        {loading && <p className="text-center text-hope-gray/40 text-2xs">This can take up to a minute.</p>}
        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
      </div>
    )
  }

  const keepCount = drafts.filter((d) => d.keep).length

  return (
    <div className="space-y-3">
      <div className="card bg-gold-500/5 border-gold-500/20">
        <p className="font-heading font-bold text-hope-blue text-sm">Suggested anchors</p>
        <p className="text-hope-gray/70 text-xs font-body mt-0.5">
          Untick any you don't want and edit the rest. Nothing is saved until you tap Keep.
          {truncated && ' This word is very long, so only its first part was read.'}
        </p>
      </div>

      {drafts.map((d) =>
        editingKey === d.key ? (
          <AnchorEditor
            key={d.key}
            initial={d}
            saving={false}
            onSave={(edited) => {
              setDrafts((list) => list!.map((x) => (x.key === d.key ? { ...x, ...edited } : x)))
              setEditingKey(null)
            }}
            onCancel={() => setEditingKey(null)}
          />
        ) : (
          <div key={d.key} className={cn('card space-y-2 transition-opacity', !d.keep && 'opacity-40')}>
            <div className="flex items-start gap-3">
              <button
                onClick={() => setDrafts((list) => list!.map((x) => (x.key === d.key ? { ...x, keep: !x.keep } : x)))}
                className={cn(
                  'mt-0.5 shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center',
                  d.keep ? 'bg-hope-blue border-hope-blue text-white' : 'border-gray-300 text-transparent',
                )}
                aria-label={d.keep ? `Don't keep ${d.title}` : `Keep ${d.title}`}
              >
                <Check className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-hope-blue text-sm">{d.title}</h3>
                <p className="font-heading font-semibold text-hope-gray text-sm leading-snug mt-1">"{d.phrase}"</p>
              </div>
              <button onClick={() => setEditingKey(d.key)} className="p-1.5 rounded-lg text-gray-300 hover:text-hope-blue" aria-label={`Edit ${d.title}`}>
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            {d.explanation && <FormattedText text={d.explanation} className="axios-prose axios-prose-sm" />}
            {d.verse_refs.length > 0 && (
              <p className="text-gold-600 text-xs font-heading font-semibold">{d.verse_refs.map(formatRef).join(' · ')}</p>
            )}
          </div>
        ),
      )}

      {error && <p className="text-red-500 text-xs text-center">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setDrafts(null)} className="btn-outline text-sm py-2.5">Discard</button>
        <button
          onClick={keepSelected}
          disabled={keepCount === 0 || saving || editingKey !== null}
          className="btn-gold text-sm py-2.5 flex items-center justify-center disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Keep ${keepCount} anchor${keepCount === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  )
}
