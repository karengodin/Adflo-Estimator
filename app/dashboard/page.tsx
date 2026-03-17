import { createServerSupabaseClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTier } from '../../lib/estimator'
import { DEFAULT_LOGIC } from '../../lib/estimator'
import type { Session } from '../../types'
import NewSessionButton from '../../components/NewSessionButton'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const isTeam = profile?.role === 'admin' || profile?.role === 'team'

  // Fetch sessions
  const query = supabase
    .from('sessions')
    .select('*, created_by_profile:profiles!sessions_created_by_fkey(full_name, email)')
    .order('updated_at', { ascending: false })

  if (!isTeam) query.eq('created_by', user.id)

  const { data: sessions } = await query

  const statusColor: Record<string, string> = {
    draft: 'bg-yellow-soft text-yellow-brand border-yellow-200',
    submitted: 'bg-accent-soft text-accent border-blue-200',
    reviewed: 'bg-green-soft text-green-brand border-green-200',
    closed: 'bg-surface-3 text-muted-3 border-border',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-base">Sessions</h1>
          <p className="text-sm text-muted mt-0.5">
            {isTeam ? 'All client estimation sessions' : 'Your estimation sessions'}
          </p>
        </div>
        <NewSessionButton />
      </div>

      {/* Stats row */}
      {isTeam && sessions && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Sessions', value: sessions.length },
            { label: 'Submitted', value: sessions.filter(s => s.status === 'submitted').length },
            { label: 'Avg Hours', value: sessions.length ? Math.round(sessions.reduce((a, s) => a + s.estimated_hours, 0) / sessions.length) : 0 },
            { label: 'Enterprise Tier', value: sessions.filter(s => s.tier === 'Enterprise').length },
          ].map(stat => (
            <div key={stat.label} className="card py-4">
              <div className="text-2xl font-bold text-accent">{stat.value}</div>
              <div className="text-xs text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {!sessions?.length ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="font-semibold text-text-base mb-2">No sessions yet</h3>
          <p className="text-sm text-muted mb-4">Create your first estimation session to get started.</p>
          <NewSessionButton />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-3 uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-3 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-3 uppercase tracking-wide">Tier</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-3 uppercase tracking-wide">Hours</th>
                {isTeam && <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-3 uppercase tracking-wide">Rep</th>}
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-3 uppercase tracking-wide">Updated</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(sessions as any[]).map(s => (
                <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-5 py-4 font-medium text-text-base">{s.client_name}</td>
                  <td className="px-5 py-4">
                    <span className={`badge border capitalize ${statusColor[s.status] ?? ''}`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge badge-${s.tier.toLowerCase()}`}>● {s.tier}</span>
                  </td>
                  <td className="px-5 py-4 text-muted-2">{s.estimated_hours} hrs</td>
                  {isTeam && (
                    <td className="px-5 py-4 text-muted-2">
                      {s.created_by_profile?.full_name ?? s.created_by_profile?.email ?? '—'}
                    </td>
                  )}
                  <td className="px-5 py-4 text-muted-3 text-xs">
                    {new Date(s.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/dashboard/sessions/${s.id}`} className="btn btn-ghost text-xs py-1.5 px-3">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
