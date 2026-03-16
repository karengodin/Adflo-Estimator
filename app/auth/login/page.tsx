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

  async function signInWithGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

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

              {/* Google */}
              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="btn btn-ghost w-full mb-4 gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-3">or email link</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Magic link */}
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
