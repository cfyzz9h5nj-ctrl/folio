import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { AutoSnapshot } from '@/components/AutoSnapshot'

export const metadata: Metadata = {
  title: 'Folio',
  description: 'Personal investment portfolio tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <AutoSnapshot />
        <Sidebar />
        <main className="min-h-screen pb-20 md:ml-56 md:pb-0">
          <div className="mx-auto max-w-6xl p-5 md:p-8">{children}</div>
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
