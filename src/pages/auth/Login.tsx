import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-hope-dark flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="font-heading text-5xl font-bold text-gradient-gold mb-2">8Hope</h1>
        <p className="text-white/60 font-body text-sm">Find Your Divine Time to Pray</p>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-sm w-full animate-slide-up">
        <h2 className="font-heading text-xl font-semibold text-hope-blue mb-1">Sign In</h2>
        <p className="text-gray-500 text-sm mb-6">Enter your email and password to continue.</p>

        <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="email">
          Email address
        </label>
        <div className="relative mb-4">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>

        <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="password">
          Password
        </label>
        <div className="relative mb-6">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-gray-300 rounded-xl pl-10 pr-10 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Sign In
        </button>
      </form>
    </div>
  )
}
