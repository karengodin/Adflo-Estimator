'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SessionEditor from '@/components/SessionEditor'
import { DEFAULT_QUESTIONS, DEFAULT_LOGIC } from '@/lib/estimator'

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(`adflo_session_${id}`)
    if (!raw) { setNotFound(true); return }
    setSession(JSON.parse(raw))
  }, [id])

  function onUpdate(updated: any) {
    const now = new Date().toISOString()
    const next = { ...updated, updated_at: now }
    localStorage.setItem(`adflo_session_${id}`, JSON.stringify(next))
    setSession(next)
  }

  if (notFound) return (
    <div className="flex flex-col items-center justify-center h-full py-32 text-muted">
      <div className="text-4xl mb-4">🔍</div>
      <p className="text-sm mb-4">Session not found.</p>
      <button className="btn btn-ghost" onClick={() => router.push('/dashboard')}>← Back to Sessions</button>
    </div>
  )

  if (!session) return (
    <div className="flex items-center justify-center h-full py-32 text-muted text-sm">Loading…</div>
  )

  return (
    <SessionEditor
      session={session}
      questions={DEFAULT_QUESTIONS}
      logic={DEFAULT_LOGIC as any}
      onUpdate={onUpdate}
    />
  )
}
