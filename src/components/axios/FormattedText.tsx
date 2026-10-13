import { lazy, Suspense, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const RichText = lazy(() => import('./RichText'))

/** Long pasted words fold to roughly the first few paragraphs. */
const COLLAPSE_AFTER_CHARS = 1200

interface FormattedTextProps {
  text: string
  collapsible?: boolean
  className?: string
}

/**
 * Markdown + math text, loaded lazily. While the formatter loads, the plain
 * text shows so nothing jumps to empty.
 */
export function FormattedText({ text, collapsible = false, className }: FormattedTextProps) {
  const [expanded, setExpanded] = useState(false)
  const folds = collapsible && text.length > COLLAPSE_AFTER_CHARS
  const folded = folds && !expanded

  return (
    <div>
      <div className={folded ? 'relative max-h-72 overflow-hidden' : undefined}>
        <Suspense fallback={<p className="font-body text-hope-gray text-sm leading-relaxed whitespace-pre-line">{text}</p>}>
          <RichText className={className}>{text}</RichText>
        </Suspense>
        {folded && <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />}
      </div>
      {folds && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 flex items-center gap-1 text-xs font-heading font-semibold text-gold-600 hover:text-gold-700"
        >
          {expanded ? 'Show less' : 'Read the full word'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}
