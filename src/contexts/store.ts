import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  UserProfile,
  PrayerWatch,
  BibleVersion,
  FavoriteVerse,
  JournalEntry,
  BibleVerse,
  HebrewDate,
  WatchName,
  MoedDailyContent,
  Language,
} from '@/types'
import { DEFAULT_VERSION_BY_LANGUAGE } from '@/lib/bible'

// ─── App Store ───────────────────────────────────────────────────────────────

interface AppState {
  // Auth
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void

  // Active prayer watch (computed from current time)
  activeWatch: PrayerWatch | null
  setActiveWatch: (watch: PrayerWatch | null) => void

  // Hebrew date
  hebrewDate: HebrewDate | null
  setHebrewDate: (date: HebrewDate) => void

  // Bible version preference (persisted)
  bibleVersion: BibleVersion
  setBibleVersion: (version: BibleVersion) => void

  // Content language preference (persisted) — Bible text + Moed devotional
  // content only, does not affect app UI chrome. Switching language resets
  // bibleVersion to that language's default in one atomic update, so the
  // two never briefly disagree.
  language: Language
  setLanguage: (lang: Language) => void

  // Today's 3 daily verses
  dailyVerses: BibleVerse[]
  setDailyVerses: (verses: BibleVerse[]) => void

  // Today's Moed content (numerology + per-verse Greek/Hebrew insight & calendar connection)
  moedContent: MoedDailyContent | null
  setMoedContent: (content: MoedDailyContent | null) => void

  // Favorites
  favorites: FavoriteVerse[]
  setFavorites: (favs: FavoriteVerse[]) => void
  addFavorite: (fav: FavoriteVerse) => void
  removeFavorite: (id: string) => void

  // Journal
  journalEntries: JournalEntry[]
  setJournalEntries: (entries: JournalEntry[]) => void
  upsertJournalEntry: (entry: JournalEntry) => void

  // Onboarding
  onboardingStep: number
  setOnboardingStep: (step: number) => void
  selectedWatchDuringOnboarding: WatchName | null
  setSelectedWatchDuringOnboarding: (watch: WatchName | null) => void

  // UI state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Active watch
      activeWatch: null,
      setActiveWatch: (watch) => set({ activeWatch: watch }),

      // Hebrew date
      hebrewDate: null,
      setHebrewDate: (date) => set({ hebrewDate: date }),

      // Bible version
      bibleVersion: 'KJV',
      setBibleVersion: (version) => set({ bibleVersion: version }),

      // Language
      language: 'en',
      setLanguage: (lang) => set({ language: lang, bibleVersion: DEFAULT_VERSION_BY_LANGUAGE[lang] }),

      // Daily verses
      dailyVerses: [],
      setDailyVerses: (verses) => set({ dailyVerses: verses }),

      // Moed content
      moedContent: null,
      setMoedContent: (content) => set({ moedContent: content }),

      // Favorites
      favorites: [],
      setFavorites: (favs) => set({ favorites: favs }),
      addFavorite: (fav) => set((state) => ({ favorites: [fav, ...state.favorites] })),
      removeFavorite: (id) => set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) })),

      // Journal
      journalEntries: [],
      setJournalEntries: (entries) => set({ journalEntries: entries }),
      upsertJournalEntry: (entry) =>
        set((state) => {
          const exists = state.journalEntries.find((e) => e.id === entry.id)
          if (exists) {
            return { journalEntries: state.journalEntries.map((e) => (e.id === entry.id ? entry : e)) }
          }
          return { journalEntries: [entry, ...state.journalEntries] }
        }),

      // Onboarding
      onboardingStep: 0,
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      selectedWatchDuringOnboarding: null,
      setSelectedWatchDuringOnboarding: (watch) => set({ selectedWatchDuringOnboarding: watch }),

      // UI
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: '8hope-storage',
      partialize: (state) => ({
        bibleVersion: state.bibleVersion,
        language: state.language,
        favorites: state.favorites,
      }),
    }
  )
)
