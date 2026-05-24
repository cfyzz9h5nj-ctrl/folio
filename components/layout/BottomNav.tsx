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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/evolution', label: 'Evolución', icon: TrendingUp },
  { href: '/capital', label: 'Capital', icon: Wallet },
  { href: '/positions', label: 'Posiciones', icon: Briefcase },
  { href: '/seguimiento', label: 'Seguimiento', icon: Telescope },
  { href: '/noticias', label: 'Noticias', icon: Newspaper },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:hidden">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
              active
                ? 'text-[#378ADD]'
                : 'text-slate-500 dark:text-slate-500',
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
