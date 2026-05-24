'use client'

import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, Pencil, Trash2, ImagePlus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fmtCurrency, cn } from '@/lib/utils'
import type { SeguimientoItem } from '@/lib/types'

/* ─── semaphore helpers ────────────────────────── */
type Sem = 'green' | 'yellow' | 'red'

function getSemaphore(price: number, high: number): Sem {
  if (price <= high) return 'green'
  if (price <= high * 1.15) return 'yellow'
  return 'red'
}

function getDistanceLabel(price: number, high: number): string {
  const pct = ((price - high) / high) * 100
  if (pct <= 0) return Math.abs(pct) < 0.5 ? 'En zona' : `${pct.toFixed(1)}% de zona`
  return `+${pct.toFixed(1)}% sobre zona`
}

function getBarPct(price: number, high: number): number {
  if (price <= high) return 100
  const pct = ((price - high) / high) * 100
  return Math.max(0, (1 - pct / 15) * 100)
}

const SEM_COLOR: Record<Sem, string> = {
  green: '#1D9E75',
  yellow: '#EF9F27',
  red: '#E24B4A',
}

/* ─── score / verdict helpers ─────────────────── */
function scoreColor(s: number) {
  if (s >= 80) return '#1D9E75'
  if (s >= 65) return '#EF9F27'
  return '#E24B4A'
}

const VERDICT_VARIANT: Record<string, 'positive' | 'default' | 'caution' | 'negative'> = {
  Comprar: 'positive',
  Mantener: 'default',
  'Esperar pullback': 'caution',
  Observar: 'caution',
  'No entrar aún': 'negative',
}

function fmtZone(low: number, high: number): string {
  if (!low && !high) return '—'
  if (!high || high === low) return fmtCurrency(low)
  return `${fmtCurrency(low)} – ${fmtCurrency(high)}`
}

/* ─── sub-components ──────────────────────────── */
function DataRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm border-b border-slate-50 dark:border-slate-800/60 last:border-0">
      <span className="shrink-0 text-xs text-slate-400">{label}</span>
      <span
        className={cn('text-right font-medium tabular-nums', danger ? 'text-[#E24B4A]' : 'text-slate-800 dark:text-slate-200')}
      >
        {value}
      </span>
    </div>
  )
}

/* ─── props ───────────────────────────────────── */
interface Props {
  item: SeguimientoItem
  currentPrice?: number
  holdingTickers: Set<string>
  onEdit: (item: SeguimientoItem) => void
  onDelete: (item: SeguimientoItem) => void
  onNotesChange: (id: string, notes: string) => void
  onImageChange: (id: string, image: string | undefined) => void
}

/* ─── component ───────────────────────────────── */
export function SeguimientoCard({
  item,
  currentPrice,
  holdingTickers,
  onEdit,
  onDelete,
  onNotesChange,
  onImageChange,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(item.notes)
  const imgInputRef = useRef<HTMLInputElement>(null)

  const price = currentPrice ?? 0
  const hasPrice = price > 0
  const hasZone = item.entryZoneHigh > 0

  const sem = hasPrice && hasZone ? getSemaphore(price, item.entryZoneHigh) : null
  const barPct = hasPrice && hasZone ? getBarPct(price, item.entryZoneHigh) : 0
  const distLabel = hasPrice && hasZone ? getDistanceLabel(price, item.entryZoneHigh) : null

  const isPortfolio = holdingTickers.has(item.ticker) || item.status === 'portfolio'
  const col = scoreColor(item.score)

  const handleNotesBlur = () => {
    if (notes !== item.notes) onNotesChange(item.id, notes)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onImageChange(item.id, ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

      {/* ── Collapsed header ───────────────────── */}
      <button
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:gap-4 sm:px-5 sm:py-4"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Semaphore dot */}
        <div className="flex-shrink-0">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: sem ? SEM_COLOR[sem] : '#cbd5e1' }}
          />
        </div>

        {/* Score circle */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums"
          style={{ borderColor: col, color: col }}
        >
          {item.score}
        </div>

        {/* Ticker + meta */}
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{item.ticker}</span>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 font-medium',
                isPortfolio
                  ? 'bg-[#378ADD]/10 text-[#378ADD]'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800',
              )}
            >
              {isPortfolio ? 'Portfolio' : 'Watchlist'}
            </span>
            {hasPrice && <span className="tabular-nums">{fmtCurrency(price)}</span>}
            {distLabel && (
              <span style={{ color: sem ? SEM_COLOR[sem] : '#94a3b8' }}>{distLabel}</span>
            )}
          </div>
        </div>

        {/* Distance bar (desktop only) */}
        {hasZone && (
          <div className="hidden w-28 flex-shrink-0 sm:block">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${barPct}%`,
                  backgroundColor: sem ? SEM_COLOR[sem] : '#cbd5e1',
                }}
              />
            </div>
          </div>
        )}

        {/* Verdict badge + chevron */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {item.verdict && (
            <Badge variant={VERDICT_VARIANT[item.verdict] ?? 'default'}>
              {item.verdict}
            </Badge>
          )}
          {expanded
            ? <ChevronUp size={15} className="text-slate-400" />
            : <ChevronDown size={15} className="text-slate-400" />
          }
        </div>
      </button>

      {/* ── Expanded: two-column layout ────────── */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-stretch">

            {/* ── Left column: image (60%) ──────── */}
            <div className="group relative md:w-[60%] md:flex-shrink-0 md:self-stretch">
              {item.image ? (
                <>
                  <div className="flex h-full min-h-56 items-center justify-center overflow-hidden rounded-bl-none rounded-br-none rounded-tl-none rounded-tr-none md:rounded-bl-xl p-2 bg-slate-50 dark:bg-slate-800/40">
                    <img
                      src={item.image}
                      alt={`Dashboard ${item.ticker}`}
                      className="h-full max-h-96 w-full object-contain md:max-h-none"
                    />
                  </div>
                  {/* Image controls (hover) */}
                  <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => imgInputRef.current?.click()}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white dark:bg-slate-900/90 dark:text-slate-200"
                    >
                      Cambiar
                    </button>
                    <button
                      onClick={() => onImageChange(item.id, undefined)}
                      className="rounded-md bg-white/90 p-1 text-slate-500 shadow hover:bg-white hover:text-[#E24B4A] dark:bg-slate-900/90"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </>
              ) : (
                /* Placeholder */
                <button
                  onClick={() => imgInputRef.current?.click()}
                  className="flex h-full min-h-56 w-full flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:bg-slate-800/40 dark:hover:bg-slate-800 md:rounded-bl-xl"
                >
                  <ImagePlus size={28} strokeWidth={1.5} />
                  <span className="text-sm">Subir imagen del dashboard</span>
                  <span
                    className="text-3xl font-black tracking-tight opacity-20"
                    style={{ color: col }}
                  >
                    {item.ticker}
                  </span>
                </button>
              )}

              <input
                ref={imgInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* ── Right column: data (40%) ──────── */}
            <div className="flex flex-col gap-0 px-4 py-4 md:w-[40%] md:px-5 md:py-5">

              {/* Score + verdict */}
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="text-4xl font-black tabular-nums leading-none"
                  style={{ color: col }}
                >
                  {item.score}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Score convicción</span>
                  {item.verdict && (
                    <Badge variant={VERDICT_VARIANT[item.verdict] ?? 'default'}>
                      {item.verdict}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thesis */}
              {item.thesis && (
                <p className="mb-4 rounded-lg border-l-2 border-[#378ADD] bg-[#378ADD]/5 px-3 py-2 text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">
                  {item.thesis}
                </p>
              )}

              {/* Zone data */}
              <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-1 dark:border-slate-800 dark:bg-slate-800/40">
                <DataRow label="Zona razonable" value={fmtZone(item.entryZoneLow, item.entryZoneHigh)} />
                <DataRow label="Zona ideal" value={fmtZone(item.entryIdealLow, item.entryIdealHigh)} />
                <DataRow
                  label="No perseguir sobre"
                  value={item.noPursueAbove ? fmtCurrency(item.noPursueAbove) : '—'}
                />
                {(item.technicalInvalidation ?? 0) > 0 && (
                  <DataRow
                    label="Inv. técnica bajo"
                    value={fmtCurrency(item.technicalInvalidation!)}
                    danger
                  />
                )}
                <DataRow
                  label="Target 12-18m"
                  value={item.target ? fmtCurrency(item.target) : '—'}
                />
              </div>

              {/* Notes */}
              <div className="mb-4 flex-1">
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Notas
                </p>
                <textarea
                  rows={4}
                  placeholder="Notas, pensamientos, resumen del análisis…"
                  className="flex w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                />
              </div>

              {/* Actions */}
              <div className="mt-auto flex items-center justify-end gap-2">
                <Button variant="destructive" size="sm" onClick={() => onDelete(item)}>
                  <Trash2 size={13} />
                  Eliminar
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onEdit(item)}>
                  <Pencil size={13} />
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
