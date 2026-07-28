import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookMarked, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useAppStore } from '@/contexts/store'
import { supabase } from '@/lib/supabase'

export function Favorites() {
  const { user, favorites, setFavorites, removeFavorite } = useAppStore()

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('date_saved', { ascending: false })
      .then(({ data }) => { if (data) setFavorites(data) })
  }, [user, setFavorites])

  async function handleRemove(id: string) {
    await supabase.from('user_favorites').delete().eq('id', id)
    removeFavorite(id)
  }

  return (
    <AppShell title="Saved Verses">
      <div className="px-4 py-5">

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <BookMarked className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="font-heading font-semibold text-hope-blue text-lg mb-2">No saved verses yet</h3>
            <p className="text-hope-gray/50 text-sm max-w-xs">
              When you bookmark a verse in The Moed Meditation, it will appear here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav, i) => (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-heading font-bold text-hope-blue text-sm">
                        {fav.book} {fav.chapter}:{fav.verse}
                      </p>
                      <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-heading">
                        {fav.bible_version}
                      </span>
                    </div>
                    <p className="text-hope-gray text-sm font-body leading-relaxed">
                      "{fav.verse_text}"
                    </p>
                    {fav.notes && (
                      <p className="text-hope-gray/60 text-xs mt-2 italic">{fav.notes}</p>
                    )}
                    <p className="text-hope-gray/40 text-xs mt-2">
                      {new Date(fav.date_saved).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(fav.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                    aria-label="Remove from favorites"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </AppShell>
  )
}
