import { BIBLE_VERSIONS_BY_LANGUAGE } from '@/lib/bible'
import { useAppStore } from '@/contexts/store'
import { cn } from '@/lib/utils'
import type { BibleVersion } from '@/types'

export function BibleVersionPicker() {
  const { bibleVersion, setBibleVersion, language } = useAppStore()
  const versions = BIBLE_VERSIONS_BY_LANGUAGE[language]

  return (
    <div>
      <p className="text-xs font-heading font-semibold text-hope-gray/50 uppercase tracking-wider mb-2">
        Translation
      </p>
      <div className="flex gap-2 flex-wrap">
        {versions.map((v) => (
          <button
            key={v}
            onClick={() => setBibleVersion(v as BibleVersion)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all',
              bibleVersion === v
                ? 'bg-hope-blue text-white shadow-sm'
                : 'bg-white border border-gray-200 text-hope-gray hover:border-hope-blue/40'
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
