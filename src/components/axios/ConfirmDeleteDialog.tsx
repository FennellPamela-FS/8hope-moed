import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'

const CONFIRM_WORD = 'DELETE'

interface ConfirmDeleteDialogProps {
  title: string
  /** What will be erased, shown as a list. */
  items: string[]
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Type-to-confirm guard for permanent deletes: the delete button stays
 * disabled until the user types DELETE.
 */
export function ConfirmDeleteDialog({ title, items, busy, onConfirm, onCancel }: ConfirmDeleteDialogProps) {
  const [typed, setTyped] = useState('')
  const armed = typed.trim().toUpperCase() === CONFIRM_WORD

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-hope-dark/80 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
      />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        role="alertdialog"
        aria-labelledby="confirm-delete-title"
        className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h2 id="confirm-delete-title" className="font-heading font-bold text-hope-blue text-lg leading-snug">{title}</h2>
        </div>

        <div>
          <p className="text-hope-gray/80 text-sm font-body mb-2">This permanently erases:</p>
          <ul className="list-disc pl-5 space-y-0.5 text-hope-gray text-sm font-body">
            {items.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="text-red-500 text-sm font-heading font-semibold mt-3">This cannot be undone.</p>
        </div>

        <div>
          <label htmlFor="confirm-delete-input" className="block text-sm text-hope-gray/80 font-body mb-1">
            Type <span className="font-heading font-bold text-hope-gray">{CONFIRM_WORD}</span> to confirm
          </label>
          <input
            id="confirm-delete-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-heading tracking-widest
                       focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <button onClick={onCancel} disabled={busy} className="btn-gold w-full">
          Cancel — keep everything
        </button>
        <button
          onClick={onConfirm}
          disabled={!armed || busy}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-heading font-semibold
                     text-red-600 border border-red-200 hover:bg-red-50 transition-colors
                     disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Delete permanently
        </button>
      </motion.div>
    </div>
  )
}
