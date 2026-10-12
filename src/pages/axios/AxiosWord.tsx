import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Pencil, Plus, Trash2, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { ScriptureVerse } from '@/components/axios/ScriptureVerse'
import { Flashcards } from '@/components/axios/Flashcards'
import { AnchorEditor, type AnchorDraft } from '@/components/axios/AnchorEditor'
import { WordForm, type WordDraft } from '@/components/axios/WordForm'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'
import { localDateString } from '@/lib/axios-content'
import type { AxiosAnchor, AxiosWord as AxiosWordRow } from '@/types'

export function AxiosWord() {
  const { user } = useAppStore()
  const { wordId } = useParams()

  if (!user?.axios_enabled || !user.axios_opted_in_at) return <Navigate to="/axios" replace />

  return (
    <AppShell title="AXIOS">
      {wordId && <WordContent userId={user.id} wordId={wordId} />}
    </AppShell>
  )
}

function WordContent({ userId, wordId }: { userId: string; wordId: string }) {
  const navigate = useNavigate()
  const [word, setWord] = useState<AxiosWordRow | null>(null)
  const [anchors, setAnchors] = useState<AxiosAnchor[]>([])
  const [notFound, setNotFound] = useState(false)
  const [editingWord, setEditingWord] = useState(false)
  const [editingAnchorId, setEditingAnchorId] = useState<string | 'new' | null>(null)
  const [saving, setSaving] = useState(false)
  const [memorizing, setMemorizing] = useState<AxiosAnchor[] | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('axios_words').select('*').eq('id', wordId).maybeSingle(),
      supabase.from('axios_anchors').select('*').eq('word_id', wordId).order('position'),
    ]).then(([w, a]) => {
      if (!w.data) { setNotFound(true); return }
      setWord(w.data as AxiosWordRow)
      setAnchors((a.data as AxiosAnchor[]) ?? [])
    })
  }, [wordId])

  if (notFound) return <Navigate to="/axios" replace />
  if (!word) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>
  }

  const today = localDateString()
  const due = anchors.filter((a) => a.next_review_on <= today)

  async function saveWord(draft: WordDraft) {
    setSaving(true)
    const { data, error } = await supabase
      .from('axios_words')
      .update({ ...draft, updated_at: new Date().toISOString() })
      .eq('id', wordId)
      .select()
      .single()
    setSaving(false)
    if (error || !data) return
    setWord(data as AxiosWordRow)
    setEditingWord(false)
  }

  async function deleteWord() {
    if (!window.confirm(`Delete "${word!.title}" and all its anchors? This cannot be undone.`)) return
    const { error } = await supabase.from('axios_words').delete().eq('id', wordId)
    if (!error) navigate('/axios', { replace: true })
  }

  async function saveAnchor(draft: AnchorDraft) {
    setSaving(true)
    if (editingAnchorId === 'new') {
      const position = anchors.reduce((max, a) => Math.max(max, a.position), 0) + 1
      const { data, error } = await supabase
        .from('axios_anchors')
        .insert({ ...draft, word_id: wordId, user_id: userId, position })
        .select()
        .single()
      setSaving(false)
      if (error || !data) return
      setAnchors((list) => [...list, data as AxiosAnchor])
    } else {
      const { data, error } = await supabase
        .from('axios_anchors')
        .update({ ...draft, updated_at: new Date().toISOString() })
        .eq('id', editingAnchorId!)
        .select()
        .single()
      setSaving(false)
      if (error || !data) return
      setAnchors((list) => list.map((a) => (a.id === data.id ? (data as AxiosAnchor) : a)))
    }
    setEditingAnchorId(null)
  }

  async function deleteAnchor(anchor: AxiosAnchor) {
    if (!window.confirm(`Delete the anchor "${anchor.title}"?`)) return
    const { error } = await supabase.from('axios_anchors').delete().eq('id', anchor.id)
    if (!error) setAnchors((list) => list.filter((a) => a.id !== anchor.id))
  }

  function updateAnchorLocally(updated: AxiosAnchor) {
    setAnchors((list) => list.map((a) => (a.id === updated.id ? updated : a)))
  }

  return (
    <div className="px-4 py-5 space-y-5">

      {/* Word header */}
      {editingWord ? (
        <WordForm initial={word} saving={saving} submitLabel="Save" onSave={saveWord} onCancel={() => setEditingWord(false)} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-gold-500 font-heading text-xs font-semibold uppercase tracking-widest mb-1">Word Over Me</p>
              <h2 className="font-heading text-2xl font-bold text-hope-blue">{word.title}</h2>
              {(word.spoken_by || word.spoken_on) && (
                <p className="text-hope-gray/60 text-sm mt-1">
                  {[word.spoken_by, word.spoken_on && new Date(word.spoken_on + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]
                    .filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditingWord(true)} className="p-2 rounded-xl text-gray-400 hover:text-hope-blue hover:bg-hope-blue/10" aria-label="Edit word">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={deleteWord} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50" aria-label="Delete word">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {word.full_text && (
            <div className="card">
              <p className="font-body text-hope-gray text-sm leading-relaxed whitespace-pre-line">{word.full_text}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Memorize */}
      {anchors.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMemorizing(due.length > 0 ? due : anchors)}
            className="btn-gold flex items-center justify-center gap-2 text-sm"
          >
            <Brain className="w-4 h-4" />
            {due.length > 0 ? `Memorize (${due.length} due)` : 'Memorize'}
          </button>
          <button onClick={() => setMemorizing(anchors)} className="btn-outline text-sm">Review all</button>
        </div>
      )}

      {/* Anchors */}
      <div className="space-y-3">
        <SectionLabel>{anchors.length} Anchors</SectionLabel>
        {anchors.map((anchor, i) =>
          editingAnchorId === anchor.id ? (
            <AnchorEditor key={anchor.id} initial={anchor} saving={saving} onSave={saveAnchor} onCancel={() => setEditingAnchorId(null)} />
          ) : (
            <motion.div
              key={anchor.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="card space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-heading font-semibold text-gold-600 uppercase tracking-widest">Anchor {i + 1}</p>
                  <h3 className="font-heading font-bold text-hope-blue">{anchor.title}</h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditingAnchorId(anchor.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-hope-blue" aria-label="Edit anchor">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteAnchor(anchor)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500" aria-label="Delete anchor">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="font-heading font-semibold text-hope-gray text-sm leading-snug">"{anchor.phrase}"</p>
              {anchor.explanation && (
                <p className="text-hope-gray/70 text-xs font-body leading-relaxed">{anchor.explanation}</p>
              )}
              {anchor.verse_refs.map((ref) => (
                <ScriptureVerse key={`${ref.book}${ref.chapter}${ref.verse}`} verseRef={ref} variant="inline" />
              ))}
            </motion.div>
          ),
        )}

        {editingAnchorId === 'new' ? (
          <AnchorEditor saving={saving} onSave={saveAnchor} onCancel={() => setEditingAnchorId(null)} />
        ) : (
          <button onClick={() => setEditingAnchorId('new')} className="btn-outline w-full flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add an anchor
          </button>
        )}
      </div>

      {/* Application */}
      {word.application && !editingWord && (
        <div className="card bg-gold-500/5 border-gold-500/20">
          <p className="text-[10px] font-heading font-semibold text-gold-600 uppercase tracking-widest mb-2">Walking It Out</p>
          <p className="font-body text-hope-gray text-sm leading-relaxed whitespace-pre-line">{word.application}</p>
        </div>
      )}

      {memorizing && (
        <Flashcards anchors={memorizing} onUpdate={updateAnchorLocally} onClose={() => setMemorizing(null)} />
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-3.5 rounded-full bg-gold-500" />
      <h3 className="font-heading text-[10px] font-semibold text-hope-gray/50 uppercase tracking-widest">
        {children}
      </h3>
    </div>
  )
}
