import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'

/**
 * One-time "New in Moed" card, shown after release to anyone who hasn't seen
 * it. Turns the optional sections on right here so nobody has to find them
 * in Settings; either way, it never shows again.
 */
export function MoedExtrasIntro() {
  const { user, setUser } = useAppStore()
  const [reflection, setReflection] = useState(true)
  const [deepStudy, setDeepStudy] = useState(true)
  const [busy, setBusy] = useState(false)

  if (!user) return null

  async function finish(turnOn: boolean) {
    if (!user) return
    setBusy(true)
    const patch = {
      moed_extras_intro_seen: true,
      ...(turnOn ? { moed_show_reflection: reflection, moed_show_deep_study: deepStudy } : {}),
    }
    await supabase.from('user_profiles').update(patch).eq('id', user.id)
    setUser({ ...user, ...patch })
  }

  return (
    <div className="card bg-gold-500/5 border-gold-500/30 space-y-3 relative">
      <button onClick={() => finish(false)} disabled={busy} className="absolute top-3 right-3 p-1 text-gray-300 hover:text-hope-gray" aria-label="Not now">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 pr-6">
        <Sparkles className="w-4 h-4 text-gold-600" />
        <h3 className="font-heading font-bold text-hope-blue">New in Moed</h3>
      </div>
      <p className="text-hope-gray/80 text-sm font-body leading-relaxed">
        Two optional sections are now available. Choose what you'd like to see — you can change this anytime in Settings.
      </p>
      <label className="flex items-start gap-3 text-sm font-body text-hope-gray">
        <input type="checkbox" checked={reflection} onChange={(e) => setReflection(e.target.checked)} className="mt-1 accent-[#1E3A5F]" />
        <span><span className="font-heading font-semibold text-hope-blue">Reflection</span> — a few sentences applying each verse to everyday life.</span>
      </label>
      <label className="flex items-start gap-3 text-sm font-body text-hope-gray">
        <input type="checkbox" checked={deepStudy} onChange={(e) => setDeepStudy(e.target.checked)} className="mt-1 accent-[#1E3A5F]" />
        <span><span className="font-heading font-semibold text-hope-blue">Deeper Word Study</span> — more on each Hebrew or Greek word and where else it appears in Scripture.</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => finish(false)} disabled={busy} className="btn-outline text-sm py-2">Not now</button>
        <button onClick={() => finish(true)} disabled={busy} className="btn-gold text-sm py-2">Save</button>
      </div>
    </div>
  )
}
