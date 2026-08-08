import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PenLine, Save, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'
import type { JournalEntry } from '@/types'

export function Journal() {
  const { user, activeWatch, journalEntries, setJournalEntries, upsertJournalEntry } = useAppStore()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const todayEntry = journalEntries.find((e) => e.entry_date === today)

  useEffect(() => {
    async function loadEntries() {
      if (!user) return
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(30)
      if (data) setJournalEntries(data as JournalEntry[])
    }
    loadEntries()
  }, [user])

  useEffect(() => {
    if (todayEntry) setContent(todayEntry.content)
  }, [todayEntry?.id])

  async function handleSave() {
    if (!user || !content.trim()) return
    setSaving(true)

    const entry: JournalEntry = {
      id: todayEntry?.id ?? crypto.randomUUID(),
      user_id: user.id,
      entry_date: today,
      content,
      watch_session: activeWatch?.watch_key,
      verse_refs: [],
      created_at: todayEntry?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('journal_entries')
      .upsert({ ...entry, user_id: user.id }, { onConflict: 'user_id,entry_date' })

    if (!error) {
      upsertJournalEntry(entry)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setSaving(false)
  }

  const pastEntries = journalEntries
    .filter((e) => e.entry_date !== today)
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
    .slice(0, 10)

  return (
    <AppShell title="Journal">
      <div className="px-4 py-5 space-y-5">

        {/* Today's entry */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-hope-blue">Today's Reflection</h2>
              <p className="text-hope-gray/50 text-xs">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {activeWatch && ` · ${activeWatch.label}`}
              </p>
            </div>
            <PenLine className="w-5 h-5 text-gold-500" />
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What is God speaking to you today? What are you grateful for? What are you praying through?"
            className="w-full h-40 bg-white border border-gray-200 rounded-2xl px-4 py-3
                       text-sm font-body text-hope-gray placeholder:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
          />

          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              '✓ Saved'
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Entry
              </>
            )}
          </button>
        </motion.div>

        {/* Past entries */}
        {pastEntries.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="font-heading text-sm font-semibold text-hope-gray/50 uppercase tracking-wider mb-3">
              Previous Entries
            </h3>
            <div className="space-y-3">
              {pastEntries.map((entry) => (
                <div key={entry.id} className="card">
                  <p className="text-xs font-heading font-semibold text-hope-gray/50 mb-1">
                    {new Date(entry.entry_date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm font-body text-hope-gray leading-relaxed line-clamp-3">
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </AppShell>
  )
}
