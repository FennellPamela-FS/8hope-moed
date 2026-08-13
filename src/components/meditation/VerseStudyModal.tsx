import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, BookOpen } from 'lucide-react'
import type { BibleVerse, MoedVerseOption } from '@/types'

interface VerseStudyModalProps {
  verse: BibleVerse
  study: MoedVerseOption | null
  onClose: () => void
}

export function VerseStudyModal({ verse, study, onClose }: VerseStudyModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-hope-dark/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-500" />
              <span className="font-heading font-semibold text-hope-blue text-sm">Deep Study</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="px-5 py-5 space-y-5 pb-safe-bottom">
            {/* Verse reference */}
            <div className="card bg-hope-blue/5 border-0">
              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-hope-blue mt-0.5 shrink-0" />
                <div>
                  <p className="font-heading font-bold text-hope-blue text-sm">{verse.ref}</p>
                  <p className="text-hope-gray/80 text-sm font-body leading-relaxed mt-1">
                    "{verse.text}"
                  </p>
                </div>
              </div>
            </div>

            {!study && (
              <div className="text-center py-6">
                <p className="text-hope-gray/50 text-sm">
                  Deeper study is unavailable right now — please check back soon.
                </p>
              </div>
            )}

            {study && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Hebrew/Greek word */}
                <div className="card border-l-4 border-l-gold-500">
                  <p className="text-xs font-heading font-semibold text-gold-500 uppercase tracking-wider mb-1">
                    Key {study.original_language} Word
                  </p>
                  <p className="font-heading font-bold text-hope-blue text-2xl">{study.hebrew_greek_word}</p>
                  <p className="text-hope-gray/60 text-sm font-body italic">{study.transliteration}</p>
                </div>

                {/* Meaning */}
                <div className="card">
                  <p className="text-xs font-heading font-semibold text-hope-gray/50 uppercase tracking-wider mb-2">
                    Original Meaning
                  </p>
                  <p className="text-hope-gray font-body text-sm leading-relaxed">{study.meaning}</p>
                </div>

                {/* Calendar connection */}
                <div className="card bg-gradient-to-br from-hope-blue to-hope-blue/80 border-0">
                  <p className="text-xs font-heading font-semibold text-gold-400 uppercase tracking-wider mb-2">
                    Context & Calendar Connection
                  </p>
                  <p className="text-white font-body text-sm leading-relaxed">{study.calendar_connection}</p>
                </div>

                {/* Prayer prompt */}
                <div className="card border-2 border-hope-green/30 bg-hope-green/5">
                  <p className="text-xs font-heading font-semibold text-hope-green uppercase tracking-wider mb-2">
                    Prayer
                  </p>
                  <p className="text-hope-gray font-body text-sm leading-relaxed italic">
                    "{study.prayer_prompt}"
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
