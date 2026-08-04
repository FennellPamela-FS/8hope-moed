import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/contexts/store'
import type { UserProfile } from '@/types'

import { Login } from '@/pages/auth/Login'
import { Onboarding } from '@/pages/onboarding/Onboarding'
import { Dashboard } from '@/pages/Dashboard'
import { Moed } from '@/pages/Moed'
import { Journal } from '@/pages/Journal'
import { Favorites } from '@/pages/Favorites'
import { Settings } from '@/pages/Settings'
import { Watches } from '@/pages/Watches'

export default function App() {
  const { user, setUser } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) setUser(data as UserProfile)
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

  if (!user) return <Login />

  if (!user.onboarding_complete) return <Onboarding />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/moed"      element={<Moed />} />
        <Route path="/journal"   element={<Journal />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/settings"  element={<Settings />} />
        <Route path="/watches"   element={<Watches />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
