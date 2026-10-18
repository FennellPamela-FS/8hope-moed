import { useState } from 'react'
import { Loader2, Sparkles, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { PRAYER_WATCHES } from '@/lib/watches'
import type { AxiosAnchor, AxiosAnchorWatch, WatchName } from '@/types'

interface WatchPairingsEditorProps {
  wordId: string
  userId: string
  anchors: AxiosAnchor[]
  pairings: AxiosAnchorWatch[]
  onSaved: (pairings: AxiosAnchorWatch[]) => void
  onClose: () => void
}

/** anchor id → watch key → reason (null when set by hand) */
type Draft = Record<string, Partial<Record<WatchName, string | null>>>

function toDraft(pairings: AxiosAnchorWatch[]): Draft {
  const draft: Draft = {}
  for (const p of pairings) (draft[p.anchor_id] ??= {})[p.watch_key] = p.reason
  return draft
}

/**
 * Pair each anchor with the prayer watches it belongs to. "Suggest with AI"
 * fills in suggestions (replacing the current draft); nothing is saved until
 * Save. Any watch can also be toggled by hand.
 */
export function WatchPairingsEditor({ wordId, userId, anchors, pairings, onSaved, onClose }: WatchPairingsEditorProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(pairings))
  const [suggesting, setSuggesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function suggest() {
    setSuggesting(true)
    setError(null)
    const { data, error } = await supabase.functions.invoke<{ pairings: Array<{ anchor_id: string; watches: Array<{ watch_key: WatchName; reason: string }> }> }>(
      'axios-pair-watches',
      { body: { word_id: wordId } },
    )
    setSuggesting(false)
    if (error || !data?.pairings) {
      setError('Suggestions could not be made right now. Please try again in a moment.')
      return
    }
    const next: Draft = {}
    for (const p of data.pairings) {
      next[p.anchor_id] = Object.fromEntries(p.watches.map((w) => [w.watch_key, w.reason || null]))
    }
    setDraft(next)
  }

  function toggle(anchorId: string, key: WatchName) {
    setDraft((d) => {
      const current = { ...(d[anchorId] ?? {}) }
      if (key in current) delete current[key]
      else current[key] = null
      return { ...d, [anchorId]: current }
    })
  }

  async function save() {
    setSaving(true)
    setError(null)
    const anchorIds = anchors.map((a) => a.id)
    const rows = anchors.flatMap((a) =>
      Object.entries(draft[a.id] ?? {}).map(([watch_key, reason]) => ({ anchor_id: a.id, user_id: userId, watch_key, reason })),
    )
    // Replace this word's pairings wholesale — simplest correct diff.
    const { error: delError } = await supabase.from('axios_anchor_watches').delete().in('anchor_id', anchorIds)
    if (delError) {
      setSaving(false)
      setError('Could not save the pairings. Please try again.')
      return
    }
    const { data, error: insError } = rows.length
      ? await supabase.from('axios_anchor_watches').insert(rows).select()
      : { data: [], error: null }
    setSaving(false)
    if (insError) {
      setError('Could not save the pairings. Please try again.')
      return
    }
    onSaved((data ?? []) as AxiosAnchorWatch[])
  }

  return (
    <div className="card space-y-4 border-gold-500/30">
      <div>
        <h3 className="font-heading font-bold text-hope-blue">Pair with Prayer Watches</h3>
        <p className="text-hope-gray/60 text-xs font-body mt-0.5">
          Tap a number to pair or unpair a watch. Paired anchors appear inside that watch on the Watches page.
        </p>
      </div>

      <button
        onClick={suggest}
        disabled={suggesting || saving}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-hope-blue text-white
                   text-sm font-heading font-semibold disabled:opacity-60"
      >
        {suggesting ? <><Loader2 className="w-4 h-4 animate-spin" /> Finding the best watches…</> : <><Sparkles className="w-4 h-4" /> Suggest with AI</>}
      </button>

      <div className="space-y-4">
        {anchors.map((a) => {
          const selected = draft[a.id] ?? {}
          return (
            <div key={a.id} className="space-y-2">
              <p className="font-heading font-semibold text-hope-blue text-sm">{a.title}</p>
              <div className="grid grid-cols-8 gap-1" role="group" aria-label={`Watches for ${a.title}`}>
                {PRAYER_WATCHES.map((w) => {
                  const on = w.watch_key in selected
                  return (
                    <button
                      key={w.watch_key}
                      onClick={() => toggle(a.id, w.watch_key)}
                      aria-pressed={on}
                      aria-label={`${w.label}, ${w.focus}`}
                      title={`${w.label} · ${w.focus}`}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-heading font-bold border transition-colors',
                        on ? 'text-white border-transparent' : 'bg-white text-hope-gray/50 border-gray-200',
                      )}
                      style={on ? { backgroundColor: w.color } : undefined}
                    >
                      {w.watch_number}
                    </button>
                  )
                })}
              </div>
              {PRAYER_WATCHES.filter((w) => w.watch_key in selected).map((w) => (
                <p key={w.watch_key} className="text-xs font-body text-hope-gray/80 leading-snug">
                  <span className="font-heading font-semibold text-hope-blue">{w.label}</span> · {w.focus}
                  {selected[w.watch_key] && <span className="block text-hope-gray/55 italic">{selected[w.watch_key]}</span>}
                </p>
              ))}
            </div>
          )
        })}
      </div>

      {error && <p className="text-red-500 text-xs text-center">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={onClose} disabled={saving} className="btn-outline text-sm py-2.5">Cancel</button>
        <button onClick={save} disabled={saving || suggesting} className="btn-gold text-sm py-2.5 flex items-center justify-center disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save pairings'}
        </button>
      </div>
    </div>
  )
}

/** Small read-only chips showing an anchor's watches. */
export function AnchorWatchChips({ watchKeys }: { watchKeys: WatchName[] }) {
  if (watchKeys.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRAYER_WATCHES.filter((w) => watchKeys.includes(w.watch_key)).map((w) => (
        <span
          key={w.watch_key}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-3xs font-heading font-semibold text-white"
          style={{ backgroundColor: w.color }}
        >
          <Clock className="w-3 h-3" /> {w.label}
        </span>
      ))}
    </div>
  )
}
