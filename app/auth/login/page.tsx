'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
    else setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-soft via-white to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent text-white text-xl font-bold mb-4 shadow-md">A</div>
          <h1 className="text-2xl font-bold text-text-base">Adflo Estimator</h1>
          <p className="text-muted text-sm mt-1">TapClicks Implementation Tool</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="font-bold text-text-base mb-2">Check your email</h2>
              <p className="text-sm text-muted">We sent a magic link to <strong>{email}</strong>. Click the link to sign in.</p>
              <button className="btn btn-ghost mt-4 w-full" onClick={() => setSent(false)}>← Try a different email</button>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-text-base mb-5">Sign in</h2>

              {/* Magic link only */}
              <form onSubmit={signInWithMagicLink} className="space-y-3">
                <div className="field-group">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    className="field-input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-xs text-red-brand">{error}</p>}
                <button type="submit" disabled={loading || !email} className="btn btn-primary w-full">
                  {loading ? 'Sending…' : 'Send magic link'}
                </button>
              </form>

              <p className="text-xs text-muted text-center mt-4">
                Clients receive a unique questionnaire link — no login needed.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
