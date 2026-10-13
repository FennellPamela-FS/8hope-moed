import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '@/contexts/store'
import { fetchVerse } from '@/lib/bible'
import { formatRef } from '@/lib/axios-content'
import type { BibleVerse, VerseRef } from '@/types'

interface ScriptureVerseProps {
  verseRef: VerseRef
  label?: string
  variant?: 'card' | 'inline'
}

/** Fetches and shows one verse in the user's selected Bible version. */
export function ScriptureVerse({ verseRef, label, variant = 'card' }: ScriptureVerseProps) {
  const { bibleVersion } = useAppStore()
  const [verse, setVerse] = useState<BibleVerse | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    fetchVerse(verseRef.book, verseRef.chapter, verseRef.verse, bibleVersion)
      .then((v) => { if (!cancelled) setVerse(v) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [verseRef.book, verseRef.chapter, verseRef.verse, bibleVersion])

  const refLabel = verse?.ref ?? formatRef(verseRef)

  if (variant === 'inline') {
    return (
      <div className="rounded-xl bg-hope-blue/5 border border-hope-blue/10 p-3">
        <p className="text-3xs font-heading font-semibold text-hope-blue uppercase tracking-wider mb-1">
          {refLabel}
        </p>
        <p className="text-hope-gray/80 text-xs font-body leading-relaxed">
          {verse ? `"${verse.text}"` : failed ? 'Unable to load verse.' : <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-500" />}
        </p>
      </div>
    )
  }

  return (
    <div className="card border-l-4 border-l-gold-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          {label && (
            <span className="text-3xs font-heading font-semibold text-gold-600 uppercase tracking-widest">
              {label}
            </span>
          )}
          <h4 className="font-heading font-bold text-hope-blue text-sm">{refLabel}</h4>
        </div>
        <span className="text-3xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-heading">
          {bibleVersion}
        </span>
      </div>
      {verse ? (
        <p className="font-body text-hope-gray leading-relaxed text-sm">"{verse.text}"</p>
      ) : failed ? (
        <p className="font-body text-hope-gray/50 text-sm">Unable to load verse. Please check your connection.</p>
      ) : (
        <Loader2 className="w-5 h-5 animate-spin text-gold-500" />
      )}
    </div>
  )
}
