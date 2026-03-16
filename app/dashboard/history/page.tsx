import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const isTeam = profile?.role === 'admin' || profile?.role === 'team'

  const query = supabase.from('history').select('*').order('date_completed', { ascending: false })
  if (!isTeam) query.eq('created_by', user.id)
  const { data: history } = await query

  const totalProjects = history?.length ?? 0
  const avgVariance = history?.length
    ? Math.round(history.reduce((a, h) => a + (h.actual_hours - h.estimated_hours), 0) / history.length)
    : 0

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-base">Project History</h1>
        <p className="text-sm text-muted mt-0.5">Completed implementations used to train the learning algorithm</p>
      </div>

      {totalProjects > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card py-4"><div className="text-2xl font-bold text-accent">{totalProjects}</div><div className="text-xs text-muted mt-1">Projects Logged</div></div>
          <div className="card py-4"><div className="text-2xl font-bold text-accent">{history?.reduce((a, h) => a + h.actual_hours, 0)}</div><div className="text-xs text-muted mt-1">Total Actual Hours</div></div>
          <div className="card py-4">
            <div className={`text-2xl font-bold ${avgVariance > 0 ? 'text-red-brand' : 'text-green-brand'}`}>{avgVariance > 0 ? '+' : ''}{avgVariance}</div>
            <div className="text-xs text-muted mt-1">Avg Variance (hrs)</div>
          </div>
          <div className="card py-4">
            <div className="text-2xl font-bold text-accent">
              {history ? Math.round(history.filter(h => Math.abs(h.actual_hours - h.estimated_hours) / h.estimated_hours < 0.1).length / history.length * 100) : 0}%
            </div>
            <div className="text-xs text-muted mt-1">Within 10% Accuracy</div>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {!history?.length ? (
          <div className="text-center py-16 text-muted">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-sm">No history yet. Log completed projects from any session.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-xs text-muted-3 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Client</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Rep</th>
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
                    <td className="px-5 py-3.5 font-medium">{h.client_name}</td>
                    <td className="px-5 py-3.5 text-muted-2">{new Date(h.date_completed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-5 py-3.5 text-muted-2">{h.rep_name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-muted-2">{h.estimated_hours} hrs</td>
                    <td className="px-5 py-3.5 font-semibold">{h.actual_hours} hrs</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold ${v > 0 ? 'text-red-brand' : 'text-green-brand'}`}>
                        {v > 0 ? '+' : ''}{v} hrs ({pct > 0 ? '+' : ''}{pct}%)
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge badge-${h.tier.toLowerCase()}`}>● {h.tier}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
