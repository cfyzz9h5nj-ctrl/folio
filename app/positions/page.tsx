'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, RefreshCw, MessageSquare } from 'lucide-react'
import { storage } from '@/lib/storage'
import { computeHoldings } from '@/lib/calculations'
import { usePrices } from '@/hooks/usePrices'
import { fmtCurrency, fmtPct, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { PositionModal } from '@/components/positions/PositionModal'
import type { Holding } from '@/lib/types'

function fmtMonthYear(d: string | null | undefined): string {
  if (!d) return '—'
  const date = new Date(d + 'T12:00:00')
  const month = date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
  const cap = month.charAt(0).toUpperCase() + month.slice(1)
  const year = String(date.getFullYear()).slice(2)
  return `${cap} ${year}`
}

/* ── Notes popover ─────────────────────────────────── */
function NotesPopover({
  notes,
  onSave,
}: {
  notes: string
  onSave: (v: string) => void
}) {
  const [draft, setDraft] = useState(notes)
  const [open, setOpen] = useState(false)

  const handleOpenChange = (v: boolean) => {
    if (!v && draft !== notes) onSave(draft)
    setOpen(v)
    if (v) setDraft(notes)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative rounded p-1 transition-colors',
            notes
              ? 'text-[#378ADD] hover:bg-blue-50 dark:hover:bg-blue-950/30'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800',
          )}
          title={notes ? 'Ver / editar nota' : 'Agregar nota'}
        >
          <MessageSquare size={14} />
          {notes && (
            <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-[#378ADD]" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Nota</p>
        <textarea
          rows={5}
          placeholder="Anotá contexto, tesis, recordatorios…"
          className="flex w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            onClick={() => { onSave(draft); setOpen(false) }}
          >
            Guardar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ── Page ──────────────────────────────────────────── */
export default function PositionsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Holding | null>(null)

  useEffect(() => {
    setHoldings(storage.getHoldings())
    setMounted(true)
  }, [])

  const tickers = [...new Set(holdings.map((h) => h.ticker))]
  const { prices, loading, refetch } = usePrices(mounted ? tickers : [])
  const computed = computeHoldings(holdings, prices).sort((a, b) => b.invested - a.invested)

  const save = (updated: Holding[]) => {
    setHoldings(updated)
    storage.setHoldings(updated)
  }

  const handleSave = (h: Holding) => {
    const exists = holdings.find((x) => x.id === h.id)
    save(exists ? holdings.map((x) => (x.id === h.id ? h : x)) : [...holdings, h])
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta posición?')) return
    save(holdings.filter((h) => h.id !== id))
  }

  const handleNotesSave = (id: string, notes: string) => {
    save(holdings.map((h) => (h.id === id ? { ...h, notes } : h)))
  }

  const openAdd = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (h: Holding) => { setEditing(h); setModalOpen(true) }

  const COLS = ['Ticker', 'Invertido', 'Desde', 'Acciones', 'Precio Prom.', 'Precio Actual', 'Valor', 'P&L', 'P&L %', 'Peso', '']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Posiciones</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {holdings.length} posición{holdings.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar precios
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus size={14} />
            Nueva posición
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {COLS.map((col) => (
                    <th
                      key={col}
                      className={cn(
                        'py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap',
                        col === 'Desde' ? 'px-3' : 'px-5',
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.length === 0 && (
                  <tr>
                    <td colSpan={COLS.length} className="px-5 py-12 text-center text-slate-400">
                      No tenés posiciones todavía.{' '}
                      <button className="text-[#378ADD] hover:underline" onClick={openAdd}>
                        Agregá una
                      </button>
                      .
                    </td>
                  </tr>
                )}
                {computed.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-slate-50 last:border-0 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-5 py-3 font-semibold">{h.ticker}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-500">{fmtCurrency(h.invested)}</td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-xs">{fmtMonthYear(h.purchaseDate)}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                      {h.shares.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-500">{fmtCurrency(h.avgPrice)}</td>
                    <td className="px-5 py-3 tabular-nums">
                      {loading ? (
                        <span className="text-slate-300 dark:text-slate-600">…</span>
                      ) : (
                        fmtCurrency(h.currentPrice)
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums">{fmtCurrency(h.currentValue)}</td>
                    <td
                      className="px-5 py-3 tabular-nums font-medium"
                      style={{ color: h.pnl >= 0 ? '#1D9E75' : '#E24B4A' }}
                    >
                      {fmtCurrency(h.pnl)}
                    </td>
                    <td
                      className="px-5 py-3 tabular-nums font-medium"
                      style={{ color: h.pnlPct >= 0 ? '#1D9E75' : '#E24B4A' }}
                    >
                      {fmtPct(h.pnlPct)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-500">{h.weight.toFixed(1)}%</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-0.5">
                        <NotesPopover
                          notes={h.notes}
                          onSave={(v) => handleNotesSave(h.id, v)}
                        />
                        <button
                          onClick={() => openEdit(h)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-[#E24B4A] dark:hover:bg-red-950/30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <PositionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        holding={editing}
        onSave={handleSave}
      />
    </div>
  )
}
