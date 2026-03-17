'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { calcEstimate, TIER_COLORS, DEFAULT_LOGIC } from '@/lib/estimator'
import type { Question, LogicSettings } from '@/types'
import SRDPanel from './SRDPanel'

interface Props {
  session: any
  questions: Question[]
  logic: LogicSettings
  onUpdate: (session: any) => void
}

type Tab = 'questionnaire' | 'levers' | 'history' | 'srd' | 'logic'

export default function SessionEditor({ session, questions, logic: initLogic, onUpdate }: Props) {
  const router = useRouter()
  const lg = initLogic ?? DEFAULT_LOGIC

  const [tab, setTab] = useState<Tab>('questionnaire')
  const [answers, setAnswers] = useState<Record<number, 'Yes' | 'No'>>(session.answers ?? {})
  const [levers, setLevers] = useState<number[]>(session.activated_levers ?? [])
  const [saved, setSaved] = useState(false)
  const [sharecopied, setShareCopied] = useState(false)
  const [clientName, setClientName] = useState(session.client_name)
  const [status, setStatus] = useState(session.status ?? 'draft')
  const [history, setHistory] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('adflo_history') || '[]') } catch { return [] }
  })
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  const estimate = calcEstimate(answers, levers, questions, lg)
  const answeredCount = Object.keys(answers).length

  function persist(updates: any) {
    const next = { ...session, ...updates, client_name: clientName, answers, activated_levers: levers, status, estimated_hours: estimate.expected, tier: estimate.tier.name }
    Object.assign(next, updates)
    onUpdate(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function answer(qId: number, val: 'Yes' | 'No') {
    const next = { ...answers, [qId]: val }
    setAnswers(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const est = calcEstimate(next, levers, questions, lg)
      persist({ answers: next, estimated_hours: est.expected, tier: est.tier.name })
    }, 600)
  }

  function toggleLever(qId: number) {
    const next = levers.includes(qId) ? levers.filter(x => x !== qId) : [...levers, qId]
    setLevers(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const est = calcEstimate(answers, next, questions, lg)
      persist({ activated_levers: next, estimated_hours: est.expected, tier: est.tier.name })
    }, 600)
  }

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  function logHistory(entry: any) {
    const next = [entry, ...history]
    setHistory(next)
    localStorage.setItem('adflo_history', JSON.stringify(next))
  }

  const cats = [...new Set(questions.map(q => q.cat))]
  const leverCandidates = questions.filter(q => q.can_remove && answers[q.id] === q.trigger && !levers.includes(q.id)).sort((a, b) => b.weight - a.weight)
  const activeLeverItems = questions.filter(q => levers.includes(q.id))
  const tierColor = TIER_COLORS[estimate.tier.name] ?? '#2f6fed'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'questionnaire', label: 'Questionnaire' },
    { id: 'levers', label: `🎛 Levers${leverCandidates.length ? ` (${leverCandidates.length})` : ''}` },
    { id: 'history', label: 'History' },
    { id: 'srd', label: '📄 SRD' },
    { id: 'logic', label: '⚙️ Logic' },
  ]

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Top bar */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <button onClick={() => router.push('/dashboard')} className="text-muted hover:text-text-base transition-colors text-sm">← Back</button>
        <input
          className="text-base font-bold text-text-base bg-transparent border-none outline-none flex-1 min-w-0"
          value={clientName}
          onChange={e => setClientName(e.target.value)}
          onBlur={() => persist({ client_name: clientName })}
        />
        {/* Estimate pill */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-border bg-surface-2 flex-shrink-0">
          <span className="text-xs text-muted-3">Est.</span>
          <span className="text-sm font-bold" style={{ color: tierColor }}>{estimate.expected} hrs</span>
          <span className={`badge badge-${estimate.tier.name.toLowerCase()} text-[11px]`}>● {estimate.tier.name}</span>
        </div>
        <button onClick={copyShareLink} className="btn btn-ghost text-xs gap-1.5 flex-shrink-0">
          {sharecopied ? '✓ Copied!' : '🔗 Copy Link'}
        </button>
        <select value={status} onChange={e => { setStatus(e.target.value); persist({ status: e.target.value }) }} className="field-input text-xs w-auto py-2 px-3 flex-shrink-0">
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
          <option value="closed">Closed</option>
        </select>
        <span className="text-xs text-muted-3 w-14 text-right flex-shrink-0">{saved ? '✓ Saved' : ''}</span>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-border px-6 flex gap-1 flex-shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text-base'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-surface-2">

        {/* ── QUESTIONNAIRE ── */}
        {tab === 'questionnaire' && (
          <div className="max-w-3xl mx-auto p-6 space-y-5">
            <div className="card py-4">
              <div className="flex items-center justify-between text-xs text-muted mb-2">
                <span>{answeredCount} of {questions.length} answered</span>
                <span>{Math.round(answeredCount / questions.length * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${answeredCount / questions.length * 100}%` }} />
              </div>
            </div>
            {cats.map(cat => (
              <div key={cat} className="card space-y-4">
                <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest">{cat}</h3>
                {questions.filter(q => q.cat === cat).map(q => {
                  const ans = answers[q.id]
                  const triggered = ans === q.trigger
                  return (
                    <div key={q.id} className={`rounded-xl p-4 border transition-colors ${triggered ? 'bg-accent-soft border-blue-200' : 'bg-surface-2 border-border'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-text-base leading-relaxed">{q.q}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[11px] text-muted-3">{q.weight} hrs</span>
                            {triggered && <span className="text-[11px] text-accent font-semibold">↑ adds hours</span>}
                            {q.can_remove && triggered && !levers.includes(q.id) && (
                              <button onClick={() => toggleLever(q.id)} className="text-[11px] text-yellow-brand hover:underline">🎛 Add to levers</button>
                            )}
                            {levers.includes(q.id) && <span className="text-[11px] text-green-brand">✓ Levered out</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {(['Yes', 'No'] as const).map(v => (
                            <button key={v} onClick={() => answer(q.id, v)} className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                              ans === v
                                ? v === 'Yes' ? 'bg-green-brand text-white border-green-700' : 'bg-red-brand text-white border-red-700'
                                : 'bg-white text-muted border-border hover:border-border-strong'
                            }`}>{v}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <div className="flex gap-3">
              <button className="btn btn-primary" onClick={() => setTab('levers')}>🎛 View Levers</button>
              <button className="btn btn-ghost" onClick={() => setTab('srd')}>📄 Generate SRD</button>
            </div>
          </div>
        )}

        {/* ── LEVERS ── */}
        {tab === 'levers' && (
          <div className="max-w-3xl mx-auto p-6 space-y-4">
            <div className="card">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xs text-muted-3 mb-0.5">Current estimate</div>
                  <div className="text-2xl font-bold" style={{ color: tierColor }}>{estimate.expected} hrs</div>
                </div>
                <div className="text-muted-3 text-lg">→</div>
                <div>
                  <div className="text-xs text-muted-3 mb-0.5">Range</div>
                  <div className="text-sm text-muted-2 font-medium">{estimate.best}–{estimate.worst} hrs</div>
                </div>
                <div className="ml-auto">
                  <span className={`badge badge-${estimate.tier.name.toLowerCase()} text-sm px-3 py-1.5`}>● {estimate.tier.name} · {estimate.tier.timeline}</span>
                </div>
              </div>
            </div>
            {activeLeverItems.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest mb-2">Active — Hours Removed</h3>
                <div className="space-y-2">
                  {activeLeverItems.map(q => (
                    <div key={q.id} className="card py-3 flex items-center justify-between gap-4 border-green-200 bg-green-soft">
                      <div>
                        <div className="text-sm font-semibold text-green-brand">{q.lever_name}</div>
                        <div className="text-xs text-muted mt-0.5">{q.lever_desc}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-green-brand">−{q.weight} hrs</span>
                        <button onClick={() => toggleLever(q.id)} className="btn btn-ghost text-xs py-1 px-2.5">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {leverCandidates.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest mb-2">Available — Click to Remove from Scope</h3>
                <div className="space-y-2">
                  {leverCandidates.map(q => (
                    <div key={q.id} className="card py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-text-base">{q.lever_name}</div>
                        <div className="text-xs text-muted mt-0.5">{q.lever_desc}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-2">−{q.weight} hrs</span>
                        <button onClick={() => toggleLever(q.id)} className="btn btn-green text-xs py-1 px-2.5">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {leverCandidates.length === 0 && activeLeverItems.length === 0 && (
              <div className="card text-center py-12 text-muted">
                <div className="text-3xl mb-3">🎛</div>
                No triggered removable items yet — answer the questionnaire first.
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div className="max-w-4xl mx-auto p-6 space-y-5">
            <LogHistoryForm session={session} estimate={estimate} answers={answers} onLog={logHistory} />
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-text-base text-sm">All Completed Projects</h3></div>
              {history.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted">No projects logged yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="bg-surface-2 border-b border-border text-xs text-muted-3 uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Client</th><th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Estimated</th><th className="text-left px-5 py-3">Actual</th>
                    <th className="text-left px-5 py-3">Variance</th><th className="text-left px-5 py-3">Tier</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {history.map((h: any, i: number) => {
                      const v = h.actual_hours - h.estimated_hours
                      const pct = Math.round((v / h.estimated_hours) * 100)
                      return (
                        <tr key={i} className="hover:bg-surface-2">
                          <td className="px-5 py-3 font-medium">{h.client_name}</td>
                          <td className="px-5 py-3 text-muted-2">{new Date(h.date_completed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="px-5 py-3 text-muted-2">{h.estimated_hours} hrs</td>
                          <td className="px-5 py-3 font-semibold">{h.actual_hours} hrs</td>
                          <td className="px-5 py-3"><span className={`text-xs font-bold ${v > 0 ? 'text-red-brand' : 'text-green-brand'}`}>{v > 0 ? '+' : ''}{v} hrs ({pct > 0 ? '+' : ''}{pct}%)</span></td>
                          <td className="px-5 py-3"><span className={`badge badge-${h.tier.toLowerCase()}`}>● {h.tier}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── SRD ── */}
        {tab === 'srd' && (
          <SRDPanel session={{ ...session, client_name: clientName, answers, activated_levers: levers }} questions={questions} logic={lg} estimate={estimate} />
        )}

        {/* ── LOGIC ── */}
        {tab === 'logic' && (
          <div className="max-w-2xl mx-auto p-6">
            <div className="card text-center py-10 text-muted">
              <div className="text-3xl mb-3">⚙️</div>
              <p className="text-sm">Logic settings are managed globally.<br />Edit weights and tiers in the <button onClick={() => router.push('/dashboard/logic')} className="text-accent hover:underline">Logic Editor</button>.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LogHistoryForm({ session, estimate, answers, onLog }: { session: any; estimate: any; answers: any; onLog: (e: any) => void }) {
  const [client, setClient] = useState(session.client_name)
  const [actual, setActual] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [rep, setRep] = useState(session.rep_name || '')
  const [msg, setMsg] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onLog({ client_name: client, rep_name: rep, date_completed: date, estimated_hours: estimate.expected, actual_hours: Number(actual), tier: estimate.tier.name, timeline: estimate.tier.timeline, answers })
    setMsg('Logged ✓')
    setActual('')
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-text-base text-sm mb-1">Log Completed Project</h3>
      <p className="text-xs text-muted mb-4">Record actual hours to improve future estimates.</p>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="field-group"><label>Client</label><input className="field-input" value={client} onChange={e => setClient(e.target.value)} required /></div>
        <div className="field-group"><label>Date Completed</label><input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} required /></div>
        <div className="field-group"><label>Actual Hours</label><input type="number" className="field-input" placeholder="e.g. 280" min="0" value={actual} onChange={e => setActual(e.target.value)} required /></div>
        <div className="field-group"><label>Rep Name</label><input className="field-input" placeholder="Optional" value={rep} onChange={e => setRep(e.target.value)} /></div>
        <div className="col-span-2 flex items-center gap-3">
          <button type="submit" disabled={!actual} className="btn btn-primary">+ Log Project</button>
          {msg && <span className="text-xs text-muted">{msg}</span>}
          <div className="ml-auto text-xs text-muted-3">Estimated: {estimate.expected} hrs · Tier: {estimate.tier.name}</div>
        </div>
      </form>
    </div>
  )
}
