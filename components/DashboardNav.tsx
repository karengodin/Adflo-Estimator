'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase-client'
import type { Profile } from '../types'

interface Props { profile: Profile | null }

export default function DashboardNav({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isTeam = profile?.role === 'admin' || profile?.role === 'team'

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const links = [
    { href: '/dashboard', label: 'Sessions', icon: '📋' },
    ...(isTeam ? [
      { href: '/dashboard/history', label: 'History', icon: '📊' },
      { href: '/dashboard/weights', label: 'Learned Weights', icon: '🧠' },
      { href: '/dashboard/logic', label: 'Logic Editor', icon: '⚙️' },
    ] : []),
  ]

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-border flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-sm">A</div>
          <div>
            <div className="text-sm font-bold text-text-base leading-none">Adflo</div>
            <div className="text-[10px] text-muted-3 mt-0.5">Implementation Estimator</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              pathname === l.href
                ? 'bg-accent-soft text-accent font-semibold'
                : 'text-muted-2 hover:bg-surface-2 hover:text-text-base'
            }`}
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div className="px-3 py-2.5 rounded-xl bg-surface-2">
          <div className="text-xs font-semibold text-text-base truncate">
            {profile?.full_name ?? profile?.email ?? 'User'}
          </div>
          <div className="text-[10px] text-muted-3 capitalize mt-0.5">{profile?.role ?? 'sales'}</div>
        </div>
        <button
          onClick={signOut}
          className="mt-1.5 w-full text-left px-3 py-2 text-xs text-muted hover:text-red-brand rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
