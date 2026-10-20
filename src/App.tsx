import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/contexts/store'
import type { UserProfile } from '@/types'
import { applyTextScale, isTextScale } from '@/lib/textScale'

import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/auth/Login'
import { ResetPassword } from '@/pages/auth/ResetPassword'
import { Onboarding } from '@/pages/onboarding/Onboarding'
import { Dashboard } from '@/pages/Dashboard'
import { Moed } from '@/pages/Moed'
import { Journal } from '@/pages/Journal'
import { Favorites } from '@/pages/Favorites'
import { Settings } from '@/pages/Settings'
import { Watches } from '@/pages/Watches'
import { AxiosHome } from '@/pages/axios/AxiosHome'
import { AxiosWord } from '@/pages/axios/AxiosWord'
import { StudyHome } from '@/pages/study/StudyHome'
import { StudyEntryPage } from '@/pages/study/StudyEntryPage'
import { CostsPricing } from '@/pages/admin/CostsPricing'

export default function App() {
  const { user, setUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(true)
  // Set when the user arrives from a password-reset email link (the link
  // redirects to /reset-password and Supabase signs them in from it).
  const [recovering, setRecovering] = useState(() => window.location.pathname === '/reset-password')
  const [loginNotice, setLoginNotice] = useState<string | undefined>()

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadProfile(session.user.id, session.user.email ?? '')
        setShowLanding(false) // skip landing if already logged in
      } else if (window.location.pathname === '/reset-password') {
        // Reset link expired or already used — no session came with it.
        window.history.replaceState(null, '', '/')
        setRecovering(false)
        setShowLanding(false)
        setLoginNotice('That reset link has expired or was already used. Tap “Forgot password?” to get a new one.')
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecovering(true)
      }
      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id, session.user.email ?? '')
      }
      if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  async function loadProfile(userId: string, email: string) {
    let { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // First sign-in: create profile so onboarding can run
    if (!data) {
      const { data: created } = await supabase
        .from('user_profiles')
        .insert({ id: userId, email, onboarding_complete: false })
        .select()
        .single()
      data = created
    }

    if (data) {
      setUser(data as UserProfile)
      if (isTextScale(data.text_scale)) applyTextScale(data.text_scale)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-hope-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold text-gradient-gold mb-2">8Hope</h1>
          <p className="text-white/40 text-sm font-body">Loading your divine time…</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      {recovering && user ? (
        <ResetPassword onDone={() => setRecovering(false)} />
      ) : !user && showLanding ? (
        <Landing onEnter={() => setShowLanding(false)} />
      ) : !user ? (
        <Login notice={loginNotice} />
      ) : !user.onboarding_complete ? (
        <Onboarding />
      ) : (
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/moed"      element={<Moed />} />
          <Route path="/journal"   element={<Journal />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="/watches"   element={<Watches />} />
          <Route path="/axios"     element={<AxiosHome />} />
          <Route path="/axios/:wordId" element={<AxiosWord />} />
          <Route path="/study"     element={<StudyHome />} />
          <Route path="/study/new/:book" element={<StudyEntryPage />} />
          <Route path="/study/entry/:id" element={<StudyEntryPage />} />
          <Route path="/admin/costs" element={<CostsPricing />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  )
}
