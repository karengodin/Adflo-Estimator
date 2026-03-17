'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SessionMeta {
  id: string
  client_name: string
  updated_at: string
  estimated_hours: number
  tier: string
  answered: number
  total: number
  status: string
}

const TIER_CLASS: Record<string, string> = {
  Bronze: 'badge-bronze',
  Silver: 'badge-silver',
  Gold: 'badge-gold',
  Enterprise: 'badge-enterprise',
}

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-yellow-soft text-yellow-brand border border-yellow-200',
  submitted: 'bg-accent-soft text-accent border border-blue-200',
  reviewed: 'bg-green-soft text-green-brand border border-green-200',
  closed: 'bg-surface-3 text-muted-3 border border-border',
}

function getSessions(): SessionMeta[] {
  try {
    const index = JSON.parse(localStorage.getItem('adflo_sessions') || '[]')
    return index.map((id: string) => {
      const raw = localStorage.getItem(`adflo_session_${id}`)
      if (!raw) return null
      const s = JSON.parse(raw)
      return {
        id,
        client_name: s.client_name || 'Untitled',
        updated_at: s.updated_at || s.created_at || new Date().toISOString(),
        estimated_hours: s.estimated_hours || 0,
        tier: s.tier || 'Bronze',
        answered: Object.keys(s.answers || {}).length,
        total: 37,
        status: s.status || 'draft',
      }
    }).filter(Boolean).sort((a: SessionMeta, b: SessionMeta) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  } catch { return [] }
}

export default function DashboardPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionMeta[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRep, setNewRep] = useState('')

  useEffect(() => { setSessions(getSessions()) }, [])

  function createSession(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const session = {
      id, client_name: newName.trim(), rep_name: newRep.trim(),
      created_at: now, updated_at: now, status: 'draft',
      answers: {}, activated_levers: [], estimated_hours: 24, tier: 'Bronze', notes: '',
    }
    localStorage.setItem(`adflo_session_${id}`, JSON.stringify(session))
    const index = JSON.parse(localStorage.getItem('adflo_sessions') || '[]')
    localStorage.setItem('adflo_sessions', JSON.stringify([id, ...index]))
    router.push(`/dashboard/sessions/${id}`)
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this session? This cannot be undone.')) return
    localStorage.removeItem(`adflo_session_${id}`)
    const index = JSON.parse(localStorage.getItem('adflo_sessions') || '[]')
    localStorage.setItem('adflo_sessions', JSON.stringify(index.filter((x: string) => x !== id)))
    setSessions(getSessions())
  }

  const filtered = sessions.filter(s => s.client_name.toLowerCase().includes(search.toLowerCase()))
  const totalHours = sessions.reduce((a, s) => a + s.estimated_hours, 0)
  const enterprise = sessions.filter(s => s.tier === 'Enterprise').length
  const submitted = sessions.filter(s => s.status === 'submitted' || s.status === 'reviewed').length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-base">Sessions</h1>
          <p className="text-sm text-muted mt-0.5">All client estimation sessions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Session</button>
      </div>

      {sessions.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Sessions', value: sessions.length },
            { label: 'Submitted / Reviewed', value: submitted },
            { label: 'Total Est. Hours', value: totalHours },
            { label: 'Enterprise Tier', value: enterprise },
          ].map(s => (
            <div key={s.label} className="card py-4">
              <div className="text-2xl font-bold text-accent">{s.value}</div>
              <div className="text-xs text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {sessions.length > 0 && (
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-text-base">{filtered.length} session{filtered.length !== 1 ? 's' : ''}</span>
            <input className="field-input w-52 py-2 text-sm" placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-semibold text-text-base mb-2">{sessions.length === 0 ? 'No sessions yet' : 'No results'}</h3>
            <p className="text-sm text-muted mb-4">{sessions.length === 0 ? 'Create your first session to start estimating.' : 'Try a different search.'}</p>
            {sessions.length === 0 && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Session</button>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-xs text-muted-3 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Client</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Tier</th>
                <th className="text-left px-5 py-3">Hours</th>
                <th className="text-left px-5 py-3">Progress</th>
                <th className="text-left px-5 py-3">Updated</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => router.push(`/dashboard/sessions/${s.id}`)}>
                  <td className="px-5 py-4 font-medium text-text-base">{s.client_name}</td>
                  <td className="px-5 py-4"><span className={`badge capitalize ${STATUS_CLASS[s.status] ?? ''}`}>{s.status}</span></td>
                  <td className="px-5 py-4"><span className={`badge ${TIER_CLASS[s.tier] ?? 'badge-bronze'}`}>● {s.tier}</span></td>
                  <td className="px-5 py-4 text-muted-2">{s.estimated_hours} hrs</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(s.answered / s.total * 100)}%` }} />
                      </div>
                      <span className="text-xs text-muted-3">{s.answered}/{s.total}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-3 text-xs">{new Date(s.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="btn btn-ghost text-xs py-1.5 px-3" onClick={e => { e.stopPropagation(); router.push(`/dashboard/sessions/${s.id}`) }}>Open →</button>
                      <button className="btn btn-danger text-xs py-1.5 px-2" onClick={e => deleteSession(s.id, e)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-lg w-full max-w-md p-7">
            <h2 className="text-lg font-bold text-text-base mb-1">New Estimation Session</h2>
            <p className="text-sm text-muted mb-5">Creates a session for a client or prospect.</p>
            <form onSubmit={createSession} className="space-y-4">
              <div className="field-group">
                <label>Client / Company Name *</label>
                <input className="field-input" placeholder="e.g. Acme Media Group" value={newName} onChange={e => setNewName(e.target.value)} autoFocus required />
              </div>
              <div className="field-group">
                <label>Sales Rep (optional)</label>
                <input className="field-input" placeholder="Your name" value={newRep} onChange={e => setNewRep(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={!newName.trim()} className="btn btn-primary flex-1">Create Session →</button>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); setNewName(''); setNewRep('') }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
