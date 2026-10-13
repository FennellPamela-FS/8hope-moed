import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRef, nextReview } from '@/lib/axios-content'
import type { AxiosAnchor } from '@/types'
import { FormattedText } from './FormattedText'

interface FlashcardsProps {
  anchors: AxiosAnchor[]
  onUpdate: (anchor: AxiosAnchor) => void
  onClose: () => void
}

/**
 * Memorize mode. Front: the anchor's title. Back: the line to memorize and
 * its verses. "Knew it" moves the card up a box (comes back later); "Review
 * again" drops it to box 0 and puts it back at the end of this session.
 */
export function Flashcards({ anchors, onUpdate, onClose }: FlashcardsProps) {
  const [queue, setQueue] = useState(anchors)
  const [flipped, setFlipped] = useState(false)
  const [doneCount, setDoneCount] = useState(0)

  const card = queue[0]

  async function answer(knewIt: boolean) {
    if (!card) return
    const schedule = nextReview(card.review_box, knewIt)
    // Review progress only — leaves updated_at alone, which tracks content
    // edits (a changed anchor is what makes the 7-day guide stale).
    const updated = { ...card, ...schedule }
    onUpdate(updated)
    supabase.from('axios_anchors').update(schedule).eq('id', card.id)
      .then(({ error }) => { if (error) console.error('anchor review save failed', error) })

    setFlipped(false)
    if (knewIt) {
      setQueue((q) => q.slice(1))
      setDoneCount((n) => n + 1)
    } else {
      setQueue((q) => [...q.slice(1), updated])
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-hope-dark flex flex-col safe-top">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="font-heading text-xs uppercase tracking-widest text-gold-400">
          Memorize · {doneCount}/{anchors.length}
        </p>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" aria-label="Close">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Centers short cards, scrolls tall ones (large text) without clipping the top. */}
      <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="min-h-full flex flex-col justify-center px-5 py-6">
        {card ? (
          <>
            <AnimatePresence mode="wait">
              <motion.button
                key={`${card.id}-${flipped}`}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: -90 }}
                transition={{ duration: 0.2 }}
                onClick={() => setFlipped((f) => !f)}
                className="w-full min-h-[320px] rounded-3xl bg-white p-6 text-left flex flex-col justify-center"
              >
                {!flipped ? (
                  <>
                    <p className="text-3xs font-heading font-semibold text-gold-600 uppercase tracking-widest mb-2">
                      Anchor
                    </p>
                    <h3 className="font-heading text-2xl font-bold text-hope-blue leading-snug">{card.title}</h3>
                    <p className="text-hope-gray/40 text-xs mt-6">Say the line, then tap to check</p>
                  </>
                ) : (
                  <>
                    <p className="font-heading text-xl font-bold text-hope-blue leading-snug mb-4">
                      "{card.phrase}"
                    </p>
                    {card.verse_refs.length > 0 && (
                      <p className="text-gold-600 font-heading text-sm font-semibold mb-3">
                        {card.verse_refs.map(formatRef).join(' · ')}
                      </p>
                    )}
                    {card.explanation && (
                      <FormattedText text={card.explanation} className="axios-prose text-hope-gray/70" />
                    )}
                  </>
                )}
              </motion.button>
            </AnimatePresence>

            {flipped && (
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={() => answer(false)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-heading font-semibold text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> Review again
                </button>
                <button onClick={() => answer(true)} className="btn-gold flex items-center justify-center gap-2 text-sm">
                  <Check className="w-4 h-4" /> Knew it
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-white">
            <p className="font-heading text-2xl font-bold text-gradient-gold mb-2">Anchored.</p>
            <p className="text-white/60 text-sm font-body mb-6">All {anchors.length} anchors reviewed.</p>
            <button onClick={onClose} className="btn-gold">Done</button>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
