import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react'

const MIN_LENGTH = 8

/**
 * Shown after the user follows a password-reset email link. Supabase has
 * already signed them in from the link; this sets the new password.
 */
export function ResetPassword({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('The passwords don\'t match.')
      return
    }

    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message || 'Could not update your password. Please request a new reset link.')
      return
    }
    navigate('/', { replace: true })
    onDone()
  }

  return (
    <div className="min-h-screen bg-hope-dark flex flex-col items-center justify-center px-6">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-5xl font-bold text-gradient-gold mb-2">8Hope</h1>
        <p className="text-white/60 font-body text-sm">Find Your Divine Time to Pray</p>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-sm w-full animate-slide-up">
        <h2 className="font-heading text-xl font-semibold text-hope-blue mb-1">Set a New Password</h2>
        <p className="text-gray-500 text-sm mb-6">Choose a password you'll use to sign in from now on.</p>

        <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="new-password">
          New password
        </label>
        <div className="relative mb-4">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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

        <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="confirm-password">
          Confirm new password
        </label>
        <div className="relative mb-6">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
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
          Save New Password
        </button>
      </form>
    </div>
  )
}
