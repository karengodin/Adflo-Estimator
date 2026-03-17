'use client'

import { useState, useRef, useCallback } from 'react'
import { calcEstimate } from '../lib/estimator'
import type { Session, Question, LogicSettings } from '../types'

interface Props {
  session: Session
  questions: Question[]
  logic: LogicSettings | null
}

const LOGIC_DEFAULT = {
  base_hours: 24, best_case_multiplier: 0.8, worst_case_multiplier: 1.3,
  tiers: [
    { name: 'Bronze', min_hours: 24, timeline: '3–5 weeks' },
    { name: 'Silver', min_hours: 60, timeline: '5–8 weeks' },
    { name: 'Gold', min_hours: 110, timeline: '8–12 weeks' },
    { name: 'Enterprise', min_hours: 180, timeline: '12–16 weeks' },
  ],
}

const TIER_BG: Record<string, string> = {
  Bronze: 'from-amber-50 to-white',
  Silver: 'from-slate-50 to-white',
  Gold: 'from-yellow-50 to-white',
  Enterprise: 'from-blue-50 to-white',
}

export default function ClientQuestionnaire({ session: initSession, questions, logic: initLogic }: Props) {
  const lg = (initLogic ?? LOGIC_DEFAULT) as LogicSettings
  const cats = [...new Set(questions.map(q => q.cat))]

  const [answers, setAnswers] = useState<Record<number, 'Yes' | 'No'>>(initSession.answers ?? {})
  const [submitted, setSubmitted] = useState(initSession.status === 'submitted' || initSession.status === 'closed')
  const [submitting, setSubmitting] = useState(false)
  const saveTimer = useRef<NodeJS.Timeout>()

  const estimate = calcEstimate(answers, initSession.activated_levers ?? [], questions, lg)
  const answered = Object.keys(answers).length
  const total = questions.length
  const pct = Math.round(answered / total * 100)

  const saveAnswers = useCallback(async (a: typeof answers, submit = false) => {
    await fetch(`/api/sessions/token/${initSession.share_token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: a, submit }),
    })
  }, [initSession.share_token])

  function answer(qId: number, val: 'Yes' | 'No') {
    const next = { ...answers, [qId]: val }
    setAnswers(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveAnswers(next), 1000)
  }

  async function handleSubmit() {
    setSubmitting(true)
    await saveAnswers(answers, true)
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    const bg = TIER_BG[estimate.tier.name] ?? 'from-blue-50 to-white'
    return (
      <div className={`min-h-screen bg-gradient-to-br ${bg} flex items-center justify-center p-6`}>
        <div className="max-w-lg w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-text-base mb-2">All Done!</h1>
          <p className="text-muted mb-8">
            Thanks for completing the questionnaire for <strong>{initSession.client_name}</strong>. 
            Our implementation team will review your answers and reach out with a tailored proposal.
          </p>
          <div className={`card inline-block px-8 py-6 bg-gradient-to-br ${bg}`}>
            <div className="text-xs text-muted-3 uppercase tracking-widest mb-2">Estimated Tier</div>
            <div className={`badge badge-${estimate.tier.name.toLowerCase()} text-base px-5 py-2.5 mb-2`}>
              ● {estimate.tier.name}
            </div>
            <div className="text-xs text-muted mt-2">{estimate.tier.timeline}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-2">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent text-white font-bold flex items-center justify-center text-sm">A</div>
            <div>
              <div className="text-sm font-bold text-text-base leading-none">Adflo Implementation Estimator</div>
              <div className="text-[11px] text-muted-3 mt-0.5">{initSession.client_name}</div>
            </div>
          </div>
          <div className="text-xs text-muted-3">{pct}% complete</div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-surface-3">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        {/* Intro */}
        <div className="card bg-accent-soft border-blue-200">
          <h2 className="font-bold text-text-base mb-1">Implementation Questionnaire</h2>
          <p className="text-sm text-muted-2 leading-relaxed">
            These questions help us understand your setup so we can give you an accurate implementation estimate. 
            Answer Yes or No for each — it only takes about 5 minutes.
          </p>
        </div>

        {/* Category progress */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {cats.map(cat => {
            const catQs = questions.filter(q => q.cat === cat)
            const catAns = catQs.filter(q => answers[q.id]).length
            const done = catAns === catQs.length
            return (
              <div key={cat} className={`rounded-xl px-3 py-2.5 border text-center ${done ? 'bg-green-soft border-green-200' : 'bg-white border-border'}`}>
                <div className="text-[10px] font-semibold text-muted-3 leading-tight">{cat}</div>
                <div className={`text-xs font-bold mt-1 ${done ? 'text-green-brand' : 'text-muted-2'}`}>
                  {catAns}/{catQs.length}
                </div>
              </div>
            )
          })}
        </div>

        {/* Questions by category */}
        {cats.map(cat => (
          <div key={cat} className="space-y-3">
            <h3 className="text-xs font-bold text-muted-3 uppercase tracking-widest px-1">{cat}</h3>
            {questions.filter(q => q.cat === cat).map(q => {
              const ans = answers[q.id]
              return (
                <div
                  key={q.id}
                  className={`card py-4 transition-colors ${ans ? 'border-border-strong' : ''}`}
                >
                  <p className="text-sm text-text-base leading-relaxed mb-3">{q.q}</p>
                  <div className="flex gap-2">
                    {(['Yes', 'No'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => answer(q.id, v)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          ans === v
                            ? v === 'Yes'
                              ? 'bg-green-brand text-white border-green-700 shadow-sm'
                              : 'bg-red-brand text-white border-red-700 shadow-sm'
                            : 'bg-surface-2 text-muted border-border hover:bg-surface-3 hover:border-border-strong'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Submit */}
        <div className="card bg-accent-soft border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-3 mb-0.5">Questions answered</div>
              <div className="text-lg font-bold text-text-base">{answered} / {total}</div>
            </div>
            {answered === total && (
              <div className={`badge badge-${estimate.tier.name.toLowerCase()} text-sm px-4 py-2`}>
                ● {estimate.tier.name}
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || answered < total}
            className="btn btn-primary w-full py-3 text-base"
          >
            {submitting ? 'Submitting…' : answered < total ? `Answer all ${total - answered} remaining questions to submit` : 'Submit Questionnaire →'}
          </button>
          {answered > 0 && answered < total && (
            <p className="text-xs text-muted-3 text-center mt-2">Your answers are auto-saved as you go.</p>
          )}
        </div>
      </div>
    </div>
  )
}
