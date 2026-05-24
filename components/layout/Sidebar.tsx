'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Briefcase,
  Telescope,
  Newspaper,
  Settings,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { storage } from '@/lib/storage'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/evolution', label: 'Evolución', icon: TrendingUp },
  { href: '/capital', label: 'Capital', icon: Wallet },
  { href: '/positions', label: 'Posiciones', icon: Briefcase },
  { href: '/seguimiento', label: 'Seguimiento', icon: Telescope },
  { href: '/noticias', label: 'Noticias', icon: Newspaper },
]

function quickExport() {
  const data = {
    holdings: storage.getHoldings(),
    cash: storage.getCash(),
    capitalHistory: storage.getCapitalHistory(),
    seguimiento: storage.getSeguimiento(),
    monthlyCapital: storage.getMonthlyCapital(),
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `folio-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-slate-200 px-5 dark:border-slate-800">
        <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          Folio
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-[#378ADD]/10 font-medium text-[#378ADD]'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
              )}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3 dark:border-slate-800">
        <button
          onClick={quickExport}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
          title="Exportar todos los datos a JSON"
        >
          <Download size={15} />
          Exportar datos
        </button>
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === '/settings'
              ? 'bg-[#378ADD]/10 font-medium text-[#378ADD]'
              : 'text-slate-500 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800',
          )}
        >
          <Settings size={15} />
          Ajustes
        </Link>
      </div>
    </aside>
  )
}
