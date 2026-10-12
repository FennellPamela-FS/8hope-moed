import { useEffect, useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { localDateString } from '@/lib/axios-content'
import type { AxiosCheckin, AxiosWalk } from '@/types'

const WALK_OPTIONS: Array<{ value: AxiosWalk; label: string }> = [
  { value: 'yes',     label: 'Yes' },
  { value: 'partly',  label: 'Partly' },
  { value: 'not_yet', label: 'Not yet' },
]

const WALK_LABEL: Record<AxiosWalk, string> = { yes: 'Matched', partly: 'Partly', not_yet: 'Not yet' }

const INPUT = `w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-body
  text-hope-gray placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-500`

/** Daily S ≡ L check-in: did my walk (L) match the call (S) today? */
export function WalkCheckin({ userId }: { userId: string }) {
  const today = localDateString()
  const [history, setHistory] = useState<AxiosCheckin[]>([])
  const [walk, setWalk] = useState<AxiosWalk | null>(null)
  const [actionStep, setActionStep] = useState('')
  const [actionDone, setActionDone] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('axios_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(15)
      .then(({ data }) => {
        if (!data) return
        const rows = data as AxiosCheckin[]
        setHistory(rows)
        const todays = rows.find((r) => r.checkin_date === today)
        if (todays) {
          setWalk(todays.walk_matched)
          setActionStep(todays.action_step ?? '')
          setActionDone(todays.action_done)
          setNote(todays.note ?? '')
        }
      })
  }, [userId, today])

  async function save() {
    if (!walk) return
    setSaving(true)
    const { data, error } = await supabase
      .from('axios_checkins')
      .upsert({
        user_id: userId,
        checkin_date: today,
        walk_matched: walk,
        action_step: actionStep.trim() || null,
        action_done: actionDone,
        note: note.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,checkin_date' })
      .select()
      .single()
    setSaving(false)
    if (error || !data) return
    setHistory((h) => [data as AxiosCheckin, ...h.filter((r) => r.checkin_date !== today)])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const past = history.filter((r) => r.checkin_date !== today).slice(0, 14)

  return (
    <div className="space-y-3">
      <div className="card space-y-3">
        <div>
          <p className="text-[10px] font-heading font-semibold text-gold-600 uppercase tracking-widest">S ≡ L · Today</p>
          <h3 className="font-heading font-bold text-hope-blue">Did my walk match the call today?</h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {WALK_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setWalk(o.value)}
              className={cn(
                'py-2 rounded-xl text-sm font-heading font-semibold border transition-colors',
                walk === o.value ? 'bg-hope-blue text-white border-hope-blue' : 'bg-white text-hope-gray border-gray-200',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={actionStep}
            onChange={(e) => setActionStep(e.target.value)}
            placeholder="Today's action step (e.g. submit the grant proposal)"
            className={INPUT}
          />
          <button
            onClick={() => setActionDone((d) => !d)}
            disabled={!actionStep.trim()}
            className={cn(
              'shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-colors disabled:opacity-30',
              actionDone ? 'bg-hope-green border-hope-green text-white' : 'border-gray-200 text-gray-300',
            )}
            aria-label={actionDone ? 'Mark action not done' : 'Mark action done'}
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did the Spirit show you? (optional)"
          rows={2}
          className={`${INPUT} resize-none`}
        />

        <button onClick={save} disabled={!walk || saving} className="btn-gold w-full flex items-center justify-center disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? '✓ Saved' : 'Save Check-in'}
        </button>
      </div>

      {past.length > 0 && (
        <div className="card">
          <p className="text-[10px] font-heading font-semibold text-hope-gray/50 uppercase tracking-widest mb-2">Recent walk</p>
          <ul className="divide-y divide-gray-100">
            {past.map((r) => (
              <li key={r.id} className="py-2 flex items-start justify-between gap-3 text-xs font-body">
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-hope-gray/60">
                    {new Date(r.checkin_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  {r.action_step && (
                    <p className={cn('text-hope-gray truncate', r.action_done && 'line-through text-hope-gray/50')}>{r.action_step}</p>
                  )}
                </div>
                <span className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 font-heading font-semibold',
                  r.walk_matched === 'yes' && 'bg-hope-green/10 text-hope-green',
                  r.walk_matched === 'partly' && 'bg-gold-500/10 text-gold-600',
                  r.walk_matched === 'not_yet' && 'bg-gray-100 text-gray-500',
                )}>
                  {WALK_LABEL[r.walk_matched]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
