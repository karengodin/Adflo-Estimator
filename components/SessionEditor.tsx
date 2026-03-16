'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { calcEstimate, TIER_COLORS } from '@/lib/estimator'
import type { Session, Profile, Question, LogicSettings, HistoryEntry } from '@/types'
import SRDPanel from './SRDPanel'

interface Props {
  session: Session
  profile: Profile | null
  questions: Question[]
  logic: LogicSettings | null
  history: HistoryEntry[]
}

type Tab = 'questionnaire' | 'levers' | 'history' | 'srd' | 'logic'

const LOGIC_DEFAULT = {
  base_hours: 24, best_case_multiplier: 0.8, worst_case_multiplier: 1.3,
  learning_blend_cap: 0.6, min_projects_for_full_learning: 20,
  tiers: [
    { name: 'Bronze', min_hours: 24, timeline: '3–5 weeks' },
    { name: 'Silver', min_hours: 60, timeline: '5–8 weeks' },
    { name: 'Gold', min_hours: 110, timeline: '8–12 weeks' },
    { name: 'Enterprise', min_hours: 180, timeline: '12–16 weeks' },
  ],
}

export default function SessionEditor({ session, profile, questions, logic: initLogic, history }: Props) {
  const router = useRouter()
  const isTeam = profile?.role === 'admin' || profile?.role === 'team'
  const lg = initLogic ?? LOGIC_DEFAULT as any

  const [tab, setTab] = useState<Tab>('questionnaire')
  const [answers, setAnswers] = useState<Record<number, 'Yes' | 'No'>>(session.answers ?? {})
  const [levers, setLevers] = useState<number[]>(session.activated_levers ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sharecopied, setShareCopied] = useState(false)
  const [clientName, setClientName] = useState(session.client_name)
  const [status, setStatus] = useState(session.status)
  const [logicState, setLogicState] = useState(lg)
  const saveTimer = useRef<NodeJS.Timeout>()

  const estimate = calcEstimate(answers, levers, questions, logicState)
  const answeredCount = Object.keys(answers).length

  // Auto-save on answers/levers change
  const save = useCallback(async (a: typeof answers, l: typeof levers, s?: string) => {
    setSaving(true)
    try {
      await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: a, activated_levers: l, client_name: clientName, status: s ?? status }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }, [session.id, clientName, status])

  function answer(qId: number, val: 'Yes' | 'No') {
    const next = { ...answers, [qId]: val }
    setAnswers(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(next, levers), 800)
  }

  function toggleLever(qId: number) {
    const next = levers.includes(qId) ? levers.filter(x => x !== qId) : [...levers, qId]
    setLevers(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(answers, next), 800)
  }

  function copyShareLink() {
    const url = `${window.location.origin}/q/${session.share_token}`
    navigator.clipboard.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  async function markStatus(s: Session['status']) {
    setStatus(s)
    await save(answers, levers, s)
    router.refresh()
  }

  // Group questions by category
  const cats = [...new Set(questions.map(q => q.cat))]

  // Removable questions that are triggered and not already levered out
  const leverCandidates = questions.filter(q =>
    q.can_remove && answers[q.id] === q.trigger && !levers.includes(q.id)
  ).sort((a, b) => b.weight - a.weight)
  const activeLeverItems = questions.filter(q => levers.includes(q.id))

  const tierColor = TIER_COLORS[estimate.tier.name] ?? '#2f6fed'

  // Learned weights calculation from history
  const learnedWeights = questions.map(q => {
    const relevant = history.filter(h => h.answers[q.id] === q.trigger && h.actual_hours > 0 && h.estimated_hours > 0)
    if (relevant.length < 2) return { question: q, learned: null, count: relevant.length }
    const ratios = relevant.map(h => h.actual_hours / h.estimated_hours)
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length
    const blendFactor = Math.min(relevant.length / logicState.min_projects_for_full_learning, logicState.learning_blend_cap)
    const learned = Math.round(q.weight * (1 + (avgRatio - 1) * blendFactor))
    return { question: q, learned, count: relevant.length, blendFactor }
  })

  const tabs: { id: Tab; label: string }[] = [
    { id: 'questionnaire', label: 'Questionnaire' },
    { id: 'levers', label: `🎛 Levers${leverCandidates.length ? ` (${leverCandidates.length})` : ''}` },
    { id: 'history', label: 'History' },
    { id: 'srd', label: '📄 SRD' },
    ...(isTeam ? [{ id: 'logic' as Tab, label: '⚙️ Logic' }] : []),
  ]

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Top bar */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <button onClick={() => router.back()} className="text-muted hover:text-text-base transition-colors text-sm">← Back</button>
        <div className="flex-1 min-w-0">
          <input
            className="text-base font-bold text-text-base bg-transparent border-none outline-none w-full"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            onBlur={() => save(answers, levers)}
          />
        </div>
        {/* Estimate pill */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-border bg-surface-2">
          <span className="text-xs text-muted-3">Est.</span>
          <span className="text-sm font-bold" style={{ color: tierColor }}>{estimate.expected} hrs</span>
          <span className={`badge badge-${estimate.tier.name.toLowerCase()} text-[11px]`}>● {estimate.tier.name}</span>
        </div>
        {/* Share */}
        <button onClick={copyShareLink} className="btn btn-ghost text-xs gap-1.5">
          {sharecopied ? '✓ Copied!' : '🔗 Share Link'}
        </button>
        {/* Status */}
        <select
          value={status}
          onChange={e => markStatus(e.target.value as any)}
          className="field-input text-xs w-auto py-2 px-3"
        >
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
          <option value="closed">Closed</option>
        </select>
        {/* Save indicator */}
        <span className="text-xs text-muted-3 w-16 text-right">
          {saving ? 'Saving…' : saved ? '✓ Saved' : ''}
        </span>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-border px-6 flex gap-1 flex-shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text-base'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-surface-2">

        {/* ── QUESTIONNAIRE ── */}
        {tab === 'questionnaire' && (
          <div className="max-w-3xl mx-auto p-6 space-y-5">
            {/* Progress */}
            <div className="card py-4">
              <div className="flex items-center justify-between text-xs text-muted mb-2">
                <span>{answeredCount} of {questions.length} answered</span>
                <span>{Math.round(answeredCount / questions.length * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${answeredCount / questions.length * 100}%` }}
                />
              </div>
            </div>

            {cats.map(cat => (
              <div key={cat} className="card space-y-4">
                <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest">{cat}</h3>
                {questions.filter(q => q.cat === cat).map(q => {
                  const ans = answers[q.id]
                  const triggered = ans === q.trigger
                  return (
                    <div key={q.id} className={`rounded-xl p-4 border transition-colors ${
                      triggered ? 'bg-accent-soft border-blue-200' : 'bg-surface-2 border-border'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-text-base leading-relaxed">{q.q}</p>
                          {isTeam && (
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[11px] text-muted-3">{q.weight} hrs</span>
                              {triggered && <span className="text-[11px] text-accent font-semibold">↑ adds hours</span>}
                              {q.can_remove && triggered && !levers.includes(q.id) && (
                                <button
                                  onClick={() => toggleLever(q.id)}
                                  className="text-[11px] text-yellow-brand hover:underline"
                                >
                                  🎛 Add to levers
                                </button>
                              )}
                              {levers.includes(q.id) && <span className="text-[11px] text-green-brand">✓ Levered out</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {(['Yes', 'No'] as const).map(v => (
                            <button
                              key={v}
                              onClick={() => answer(q.id, v)}
                              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                                ans === v
                                  ? v === 'Yes'
                                    ? 'bg-green-brand text-white border-green-700'
                                    : 'bg-red-brand text-white border-red-700'
                                  : 'bg-white text-muted border-border hover:border-border-strong'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
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
                  <span className={`badge badge-${estimate.tier.name.toLowerCase()} text-sm px-3 py-1.5`}>
                    ● {estimate.tier.name} · {estimate.tier.timeline}
                  </span>
                </div>
              </div>
            </div>

            {/* Active levers */}
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

            {/* Available levers */}
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
            <LogHistoryForm session={session} estimate={estimate} answers={answers} onSaved={() => router.refresh()} />

            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-text-base text-sm">All Completed Projects</h3>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted">No projects logged yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-2 border-b border-border text-xs text-muted-3 uppercase tracking-wide">
                      <th className="text-left px-5 py-3">Client</th>
                      <th className="text-left px-5 py-3">Date</th>
                      <th className="text-left px-5 py-3">Estimated</th>
                      <th className="text-left px-5 py-3">Actual</th>
                      <th className="text-left px-5 py-3">Variance</th>
                      <th className="text-left px-5 py-3">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.map(h => {
                      const v = h.actual_hours - h.estimated_hours
                      const pct = Math.round((v / h.estimated_hours) * 100)
                      return (
                        <tr key={h.id} className="hover:bg-surface-2">
                          <td className="px-5 py-3 font-medium">{h.client_name}</td>
                          <td className="px-5 py-3 text-muted-2">{new Date(h.date_completed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="px-5 py-3 text-muted-2">{h.estimated_hours} hrs</td>
                          <td className="px-5 py-3 font-semibold">{h.actual_hours} hrs</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-semibold ${v > 0 ? 'text-red-brand' : 'text-green-brand'}`}>
                              {v > 0 ? '+' : ''}{v} hrs ({pct > 0 ? '+' : ''}{pct}%)
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`badge badge-${h.tier.toLowerCase()}`}>● {h.tier}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Learned weights */}
            {history.length > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-semibold text-text-base text-sm">Learned Weight Adjustments</h3>
                  <p className="text-xs text-muted mt-0.5">Based on {history.length} logged project{history.length !== 1 ? 's' : ''}</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-2 border-b border-border text-xs text-muted-3 uppercase tracking-wide">
                      <th className="text-left px-5 py-3">Question</th>
                      <th className="text-left px-5 py-3">Manual</th>
                      <th className="text-left px-5 py-3">Learned</th>
                      <th className="text-left px-5 py-3">Δ</th>
                      <th className="text-left px-5 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {learnedWeights.filter(lw => lw.learned !== null).map(lw => {
                      const delta = (lw.learned ?? lw.question.weight) - lw.question.weight
                      return (
                        <tr key={lw.question.id} className="hover:bg-surface-2">
                          <td className="px-5 py-3 text-muted-2 text-xs max-w-xs truncate">{lw.question.q}</td>
                          <td className="px-5 py-3">{lw.question.weight} hrs</td>
                          <td className="px-5 py-3 font-semibold">{lw.learned} hrs</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-bold ${delta > 0 ? 'text-red-brand' : 'text-green-brand'}`}>
                              {delta > 0 ? '+' : ''}{delta}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-3">{lw.count} projects</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── SRD ── */}
        {tab === 'srd' && (
          <SRDPanel
            session={{ ...session, client_name: clientName, answers, activated_levers: levers }}
            questions={questions}
            logic={logicState}
            estimate={estimate}
          />
        )}

        {/* ── LOGIC EDITOR ── */}
        {tab === 'logic' && isTeam && (
          <LogicEditor logic={logicState} setLogic={setLogicState} questions={questions} sessionId={session.id} />
        )}

      </div>
    </div>
  )
}

// ── Log History Form ────────────────────────────────────────────────────
function LogHistoryForm({ session, estimate, answers, onSaved }: {
  session: Session
  estimate: ReturnType<typeof calcEstimate>
  answers: Record<number, 'Yes' | 'No'>
  onSaved: () => void
}) {
  const [client, setClient] = useState(session.client_name)
  const [actual, setActual] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [rep, setRep] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: client,
        rep_name: rep,
        date_completed: date,
        estimated_hours: estimate.expected,
        actual_hours: Number(actual),
        tier: estimate.tier.name,
        timeline: estimate.tier.timeline,
        answers,
        session_id: session.id,
      }),
    })
    setSaving(false)
    if (res.ok) { setMsg('Logged ✓'); setActual(''); onSaved() }
    else { const d = await res.json(); setMsg(d.error ?? 'Error') }
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-text-base text-sm mb-1">Log Completed Project</h3>
      <p className="text-xs text-muted mb-4">Record actual hours to improve future estimates via the learning algorithm.</p>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="field-group">
          <label>Client</label>
          <input className="field-input" value={client} onChange={e => setClient(e.target.value)} required />
        </div>
        <div className="field-group">
          <label>Date Completed</label>
          <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div className="field-group">
          <label>Actual Hours</label>
          <input type="number" className="field-input" placeholder="e.g. 280" min="0" value={actual} onChange={e => setActual(e.target.value)} required />
        </div>
        <div className="field-group">
          <label>Rep Name</label>
          <input className="field-input" placeholder="Optional" value={rep} onChange={e => setRep(e.target.value)} />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <button type="submit" disabled={saving || !actual} className="btn btn-primary">
            {saving ? 'Saving…' : '+ Log Project'}
          </button>
          {msg && <span className="text-xs text-muted">{msg}</span>}
          <div className="ml-auto text-xs text-muted-3">
            Estimated: {(calcEstimate as any).expected ?? '—'} hrs · Tier: {(calcEstimate as any).tier?.name ?? '—'}
          </div>
        </div>
      </form>
    </div>
  )
}

// ── Logic Editor ────────────────────────────────────────────────────────
function LogicEditor({ logic, setLogic, questions, sessionId }: {
  logic: any
  setLogic: (l: any) => void
  questions: Question[]
  sessionId: string
}) {
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    setSaving(true)
    const res = await fetch('/api/logic', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logic),
    })
    setSaving(false)
    setMsg(res.ok ? 'Saved ✓' : 'Error saving')
    setTimeout(() => setMsg(''), 2500)
  }

  function update(key: string, val: any) {
    setLogic({ ...logic, [key]: val })
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="card space-y-3">
          <h3 className="font-semibold text-text-base text-sm">Base Settings</h3>
          {[
            { key: 'base_hours', label: 'Base Hours', unit: 'hrs' },
            { key: 'best_case_multiplier', label: 'Best Case Multiplier', unit: '×', step: 0.05 },
            { key: 'worst_case_multiplier', label: 'Worst Case Multiplier', unit: '×', step: 0.05 },
            { key: 'learning_blend_cap', label: 'Learning Blend Cap', unit: 'max', step: 0.05 },
            { key: 'min_projects_for_full_learning', label: 'Min Projects (Full Learning)', unit: 'proj' },
          ].map(f => (
            <div key={f.key} className="flex items-center gap-3">
              <label className="text-xs text-muted flex-1">{f.label}</label>
              <input
                type="number"
                step={f.step ?? 1}
                className="field-input w-24 text-right"
                value={logic[f.key]}
                onChange={e => update(f.key, Number(e.target.value))}
              />
              <span className="text-xs text-muted-3 w-8">{f.unit}</span>
            </div>
          ))}
        </div>
        <div className="card space-y-3">
          <h3 className="font-semibold text-text-base text-sm">Tier Thresholds</h3>
          {logic.tiers.map((t: any, i: number) => (
            <div key={t.name} className="flex items-center gap-3">
              <span className={`badge badge-${t.name.toLowerCase()} w-24 justify-center`}>{t.name}</span>
              <input
                type="number"
                className="field-input w-20 text-right"
                value={t.min_hours}
                onChange={e => {
                  const next = [...logic.tiers]
                  next[i] = { ...t, min_hours: Number(e.target.value) }
                  update('tiers', next)
                }}
              />
              <span className="text-xs text-muted-3">hrs min</span>
              <input
                className="field-input flex-1"
                value={t.timeline}
                onChange={e => {
                  const next = [...logic.tiers]
                  next[i] = { ...t, timeline: e.target.value }
                  update('tiers', next)
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-text-base text-sm mb-3">Question Weights</h3>
        <p className="text-xs text-muted mb-4">Changes here update the global logic settings shared across all sessions.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-xs text-muted-3 uppercase tracking-wide">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Question</th>
                <th className="text-left px-4 py-3 w-16">Trigger</th>
                <th className="text-left px-4 py-3 w-20">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {questions.map(q => (
                <tr key={q.id} className="hover:bg-surface-2">
                  <td className="px-4 py-2.5 text-muted-3 text-xs">{q.id}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-2">{q.cat}</td>
                  <td className="px-4 py-2.5 text-xs text-text-base max-w-sm">{q.q}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge text-[10px] ${q.trigger === 'Yes' ? 'bg-green-soft text-green-brand border-green-200' : 'bg-red-soft text-red-brand border-red-200'}`}>{q.trigger}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      className="field-input w-16 text-right py-1"
                      defaultValue={q.weight}
                      onBlur={async e => {
                        const newWeight = Number(e.target.value)
                        await fetch(`/api/questions/${q.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ weight: newWeight }),
                        })
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? 'Saving…' : 'Save Logic Changes'}
        </button>
        {msg && <span className="text-xs text-muted">{msg}</span>}
      </div>
    </div>
  )
}
