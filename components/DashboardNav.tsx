'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardNav({ profile }: { profile: any }) {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Sessions', icon: '📋' },
    { href: '/dashboard/history', label: 'History', icon: '📊' },
    { href: '/dashboard/logic', label: 'Logic Editor', icon: '⚙️' },
  ]

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-border flex flex-col min-h-screen">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-sm">A</div>
          <div>
            <div className="text-sm font-bold text-text-base leading-none">Adflo</div>
            <div className="text-[10px] text-muted-3 mt-0.5">Implementation Estimator</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(l => (
          <Link key={l.href} href={l.href} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
            pathname === l.href || (l.href !== '/dashboard' && pathname.startsWith(l.href))
              ? 'bg-accent-soft text-accent font-semibold'
              : 'text-muted-2 hover:bg-surface-2 hover:text-text-base'
          }`}>
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="text-[11px] text-muted-3 text-center">TapClicks · Adflo Estimator</div>
      </div>
    </aside>
  )
}
