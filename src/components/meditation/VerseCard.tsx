import { useState } from 'react'
import { BookmarkPlus, BookmarkCheck, Share2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'
import type { BibleVerse, MoedVerseOption } from '@/types'

interface VerseCardProps {
  verse: BibleVerse
  verseNumber: number
  study?: MoedVerseOption
  onStudy: () => void
}

const BOOK_LABELS: Record<string, string> = {
  PSA: 'Psalms', PRO: 'Proverbs', MAT: 'Matthew', MRK: 'Mark',
  LUK: 'Luke', JHN: 'John', ACT: 'Acts', ROM: 'Romans',
  '1CO': '1 Corinthians', '2CO': '2 Corinthians', GAL: 'Galatians',
  EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians',
}

export function VerseCard({ verse, verseNumber, study, onStudy }: VerseCardProps) {
  const { user, favorites, addFavorite, removeFavorite } = useAppStore()
  const isSaved = favorites.some(
    (f) => f.book === verse.book && f.chapter === verse.chapter && f.verse === verse.verse
  )
  const [saving, setSaving] = useState(false)

  const bookLabel = study?.book_name ?? BOOK_LABELS[verse.book] ?? verse.book

  async function toggleFavorite() {
    if (!user) return
    setSaving(true)

    if (isSaved) {
      const fav = favorites.find(
        (f) => f.book === verse.book && f.chapter === verse.chapter && f.verse === verse.verse
      )
      if (fav) {
        await supabase.from('user_favorites').delete().eq('id', fav.id)
        removeFavorite(fav.id)
      }
    } else {
      const newFav = {
        id: crypto.randomUUID(),
        user_id: user.id,
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        verse_text: verse.text,
        bible_version: verse.version,
        date_saved: new Date().toISOString(),
      }
      await supabase.from('user_favorites').insert(newFav)
      addFavorite(newFav)
    }

    setSaving(false)
  }

  async function share() {
    const text = `${verse.ref} (${verse.version})\n\n"${verse.text}"\n\n— via 8Hope`
    if (navigator.share) {
      await navigator.share({ text })
    } else {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className={cn(
      'card hover:shadow-md transition-all duration-200',
      'border-l-4',
      verseNumber === 1 && 'border-l-gold-500',
      verseNumber === 2 && 'border-l-hope-blue',
      verseNumber === 3 && 'border-l-hope-green',
    )}>
      {/* Verse label */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-heading font-semibold text-hope-gray/40 uppercase tracking-wider">
            Verse {verseNumber}
          </span>
          <h4 className="font-heading font-bold text-hope-blue text-sm">
            {bookLabel} {verse.chapter}:{verse.verse}
          </h4>
        </div>
        <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-heading">
          {verse.version}
        </span>
      </div>

      {/* Verse text */}
      <p className="font-body text-hope-gray leading-relaxed text-sm mb-4">
        "{verse.text}"
      </p>

      {/* Calendar Connection — only when Gemini found a genuine one */}
      {study?.calendar_connection && (
        <div className="mb-4 rounded-xl bg-hope-green/5 border border-hope-green/10 p-3">
          <p className="text-[10px] font-heading font-semibold text-hope-green uppercase tracking-wider mb-1">
            Calendar Connection
          </p>
          <p className="text-hope-gray/80 text-xs font-body leading-relaxed">
            {study.calendar_connection}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={onStudy}
          disabled={!study}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                     bg-hope-blue text-white text-xs font-heading font-semibold
                     hover:bg-hope-blue/90 active:scale-95 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          aria-label={study ? 'Study Deeper' : 'Deeper study unavailable'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Study Deeper
        </button>

        <button
          onClick={toggleFavorite}
          disabled={saving}
          className={cn(
            'p-2 rounded-xl transition-colors',
            isSaved ? 'text-gold-500 bg-gold-50' : 'text-gray-400 hover:text-gold-500 hover:bg-gold-50'
          )}
          aria-label={isSaved ? 'Remove from favorites' : 'Save to favorites'}
        >
          {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
        </button>

        <button
          onClick={share}
          className="p-2 rounded-xl text-gray-400 hover:text-hope-blue hover:bg-hope-blue/10 transition-colors"
          aria-label="Share verse"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
