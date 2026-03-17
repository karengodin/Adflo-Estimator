'use client'

import { useState } from 'react'
import { DEFAULT_QUESTIONS, DEFAULT_LOGIC } from '@/lib/estimator'

export default function LogicPage() {
  const [msg, setMsg] = useState('')

  function reset() {
    if (!confirm('Reset all logic to defaults? This cannot be undone.')) return
    localStorage.removeItem('adflo_logic')
    setMsg('Reset to defaults ✓')
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-base">Logic Editor</h1>
        <p className="text-sm text-muted mt-0.5">Question weights and tier thresholds</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card">
          <h3 className="font-semibold text-text-base text-sm mb-3">Base Settings</h3>
          {[
            { label: 'Base Hours', value: DEFAULT_LOGIC.base_hours, unit: 'hrs' },
            { label: 'Best Case', value: DEFAULT_LOGIC.best_case_multiplier, unit: '×' },
            { label: 'Worst Case', value: DEFAULT_LOGIC.worst_case_multiplier, unit: '×' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3 mb-2">
              <span className="text-xs text-muted flex-1">{f.label}</span>
              <span className="text-sm font-semibold text-text-base">{f.value} {f.unit}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 className="font-semibold text-text-base text-sm mb-3">Tiers</h3>
          {DEFAULT_LOGIC.tiers.map(t => (
            <div key={t.name} className="flex items-center gap-3 mb-2">
              <span className={`badge badge-${t.name.toLowerCase()} text-[11px]`}>● {t.name}</span>
              <span className="text-xs text-muted flex-1">{t.min_hours}+ hrs</span>
              <span className="text-xs text-muted-2">{t.timeline}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-text-base text-sm">Question Weights</h3>
          <p className="text-xs text-muted mt-0.5">Editing per-question weights coming soon — edit the HTML tool's Logic Editor for now.</p>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-surface-2 border-b border-border text-xs text-muted-3 uppercase tracking-wide">
            <th className="text-left px-5 py-3 w-8">#</th>
            <th className="text-left px-5 py-3">Category</th>
            <th className="text-left px-5 py-3">Question</th>
            <th className="text-left px-5 py-3 w-16">Trigger</th>
            <th className="text-left px-5 py-3 w-20">Weight</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {DEFAULT_QUESTIONS.map(q => (
              <tr key={q.id} className="hover:bg-surface-2">
                <td className="px-5 py-2.5 text-muted-3 text-xs">{q.id}</td>
                <td className="px-5 py-2.5 text-xs text-muted-2">{q.cat}</td>
                <td className="px-5 py-2.5 text-xs text-text-base max-w-xs">{q.q}</td>
                <td className="px-5 py-2.5"><span className={`badge text-[10px] ${q.trigger === 'Yes' ? 'bg-green-soft text-green-brand border border-green-200' : 'bg-red-soft text-red-brand border border-red-200'}`}>{q.trigger}</span></td>
                <td className="px-5 py-2.5 font-semibold text-xs">{q.weight} hrs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={reset} className="btn btn-danger text-sm">Reset to Defaults</button>
        {msg && <span className="text-xs text-muted">{msg}</span>}
      </div>
    </div>
  )
}
