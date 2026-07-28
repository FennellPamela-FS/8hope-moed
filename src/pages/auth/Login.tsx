import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, Loader2 } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
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

      {sent ? (
        <div className="card max-w-sm w-full text-center animate-fade-in">
          <Mail className="w-12 h-12 text-gold-500 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-semibold text-hope-blue mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm">
            We sent a magic link to <strong>{email}</strong>.
            Tap it to sign in — no password needed.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card max-w-sm w-full animate-slide-up">
          <h2 className="font-heading text-xl font-semibold text-hope-blue mb-1">Sign In</h2>
          <p className="text-gray-500 text-sm mb-6">We'll send you a magic link to get started.</p>

          <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gold-500 mb-4"
          />

          {error && (
            <p className="text-red-500 text-sm mb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Magic Link
          </button>
        </form>
      )}
    </div>
  )
}
