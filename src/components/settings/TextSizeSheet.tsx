import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEXT_SCALES, type TextScale } from '@/lib/textScale'

interface TextSizeSheetProps {
  open: boolean
  value: TextScale
  onChange: (scale: TextScale) => void
  onClose: () => void
}

/** Bottom sheet with the Text Size options and a live preview. */
export function TextSizeSheet({ open, value, onChange, onClose }: TextSizeSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-hope-dark/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="text-size-title"
            className="relative w-full sm:max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-t-3xl px-5 pt-3 pb-6 safe-bottom"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200" />
            <h2 id="text-size-title" className="font-heading font-bold text-hope-blue text-lg">Text Size</h2>
            <p className="text-hope-gray/50 text-xs mb-3">Makes all text in the app larger or smaller. Saved to your account.</p>

            <div role="radiogroup" aria-label="Text size" className="space-y-1.5">
              {TEXT_SCALES.map(({ value: scale, label }) => {
                const selected = value === scale
                return (
                  <button
                    key={scale}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChange(scale)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors',
                      selected ? 'border-hope-blue bg-hope-blue/5' : 'border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <span className={cn(
                      'shrink-0 w-5 h-5 rounded-full border flex items-center justify-center',
                      selected ? 'bg-hope-blue border-hope-blue text-white' : 'border-gray-300 text-transparent',
                    )}>
                      <Check className="w-3 h-3" />
                    </span>
                    {/* Each label is drawn at its own size, independent of the current setting. */}
                    <span className="font-heading font-semibold text-hope-blue leading-snug" style={{ fontSize: `${0.875 * scale / 100}rem` }}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 rounded-xl bg-hope-light border border-gray-100 p-3">
              <p className="text-3xs font-heading font-semibold text-gold-600 uppercase tracking-widest mb-1">Preview · Romans 8:18</p>
              <p className="text-sm font-body text-hope-gray leading-relaxed">
                "For I reckon that the sufferings of this present time are not worthy to be compared with the glory which shall be revealed in us."
              </p>
            </div>

            <button onClick={onClose} className="btn-gold w-full mt-4">Done</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
