'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewSessionButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [clientName, setClientName] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!clientName.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: clientName.trim(), notes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create'); setLoading(false); return }
      setOpen(false)
      setClientName('')
      setNotes('')
      router.push(`/dashboard/sessions/${data.id}`)
      router.refresh()
    } catch (err) {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + New Session
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-lg w-full max-w-md p-7">
            <h2 className="text-lg font-bold text-text-base mb-1">New Estimation Session</h2>
            <p className="text-sm text-muted mb-5">Creates a unique questionnaire link you can share with the client.</p>

            <form onSubmit={create} className="space-y-4">
              <div className="field-group">
                <label>Client / Company Name *</label>
                <input
                  className="field-input"
                  placeholder="e.g. Acme Media Group"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="field-group">
                <label>Internal Notes (optional)</label>
                <textarea
                  className="field-textarea"
                  placeholder="Deal context, referral source, etc."
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
              {error && <p className="text-xs text-red-brand">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading || !clientName.trim()} className="btn btn-primary flex-1">
                  {loading ? 'Creating…' : 'Create Session'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
