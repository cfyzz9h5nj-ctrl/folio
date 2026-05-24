'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { storage } from '@/lib/storage'
import { usePrices } from '@/hooks/usePrices'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { SeguimientoCard } from '@/components/seguimiento/SeguimientoCard'
import { SeguimientoDrawer } from '@/components/seguimiento/SeguimientoDrawer'
import type { Holding, SeguimientoItem } from '@/lib/types'

/* ─── semaphore order for sort ─────────────────── */
type Sem = 'green' | 'yellow' | 'red'

function getSemaphore(price: number, high: number): Sem {
  if (price <= high) return 'green'
  if (price <= high * 1.15) return 'yellow'
  return 'red'
}

const SEM_ORDER: Record<Sem, number> = { green: 0, yellow: 1, red: 2 }

/* ─── tabs ─────────────────────────────────────── */
const TABS = [
  { value: 'all', label: 'Todas' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'watchlist', label: 'Watchlist' },
]

/* ─── page ─────────────────────────────────────── */
export default function SeguimientoPage() {
  const [items, setItems] = useState<SeguimientoItem[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [tab, setTab] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<SeguimientoItem | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setHoldings(storage.getHoldings())
    // Migrate from old keys if seguimiento is empty
    const data = storage.migrateSeguimiento()
    setItems(data)
    setMounted(true)
  }, [])

  const holdingTickers = useMemo(
    () => new Set(holdings.map((h) => h.ticker)),
    [holdings],
  )

  const allTickers = useMemo(
    () => [...new Set(items.map((i) => i.ticker))],
    [items],
  )

  const { prices, loading, refetch } = usePrices(mounted ? allTickers : [])

  /* ── filtering ──────────────────────────────── */
  const filtered = useMemo(() => {
    if (tab === 'portfolio')
      return items.filter((i) => holdingTickers.has(i.ticker) || i.status === 'portfolio')
    if (tab === 'watchlist')
      return items.filter((i) => !holdingTickers.has(i.ticker) && i.status !== 'portfolio')
    return items
  }, [items, tab, holdingTickers])

  /* ── sorted by semaphore ─────────────────────── */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const pa = prices[a.ticker] ?? 0
      const pb = prices[b.ticker] ?? 0
      const ha = a.entryZoneHigh
      const hb = b.entryZoneHigh
      const sa = pa > 0 && ha > 0 ? SEM_ORDER[getSemaphore(pa, ha)] : 3
      const sb = pb > 0 && hb > 0 ? SEM_ORDER[getSemaphore(pb, hb)] : 3
      return sa - sb
    })
  }, [filtered, prices])

  /* ── tabs with counts ───────────────────────── */
  const tabsWithCount = TABS.map((t) => ({
    ...t,
    count:
      t.value === 'all'
        ? items.length
        : t.value === 'portfolio'
        ? items.filter((i) => holdingTickers.has(i.ticker) || i.status === 'portfolio').length
        : items.filter((i) => !holdingTickers.has(i.ticker) && i.status !== 'portfolio').length,
  }))

  /* ── handlers ───────────────────────────────── */
  const save = (updated: SeguimientoItem[]) => {
    setItems(updated)
    storage.setSeguimiento(updated)
  }

  const handleSave = (item: SeguimientoItem) => {
    const exists = items.find((x) => x.id === item.id)
    save(exists ? items.map((x) => (x.id === item.id ? item : x)) : [item, ...items])
  }

  const handleDelete = (item: SeguimientoItem) => {
    if (!confirm(`¿Eliminar ${item.ticker}?`)) return
    save(items.filter((x) => x.id !== item.id))
  }

  const handleNotesChange = (id: string, notes: string) => {
    save(
      items.map((x) =>
        x.id === id ? { ...x, notes, updatedAt: new Date().toISOString() } : x,
      ),
    )
  }

  const handleImageChange = (id: string, image: string | undefined) => {
    save(
      items.map((x) =>
        x.id === id ? { ...x, image, updatedAt: new Date().toISOString() } : x,
      ),
    )
  }

  const openAdd = () => {
    setEditing(null)
    setDrawerOpen(true)
  }

  const openEdit = (item: SeguimientoItem) => {
    setEditing(item)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Seguimiento</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {items.length} empresa{items.length !== 1 ? 's' : ''} · candidatos y análisis
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={tab} onChange={setTab} tabs={tabsWithCount} />
          <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus size={14} />
            Nueva empresa
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-800">
          <p>
            {tab === 'all'
              ? 'Sin empresas en seguimiento.'
              : `Sin empresas en ${tab}.`}
          </p>
          {tab === 'all' && (
            <button className="text-[#378ADD] hover:underline" onClick={openAdd}>
              Agregar empresa
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => (
            <SeguimientoCard
              key={item.id}
              item={item}
              currentPrice={prices[item.ticker]}
              holdingTickers={holdingTickers}
              onEdit={openEdit}
              onDelete={handleDelete}
              onNotesChange={handleNotesChange}
              onImageChange={handleImageChange}
            />
          ))}
        </div>
      )}

      <SeguimientoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={editing}
        onSave={handleSave}
      />
    </div>
  )
}
