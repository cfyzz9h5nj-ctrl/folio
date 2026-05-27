'use client'

import { useState, useEffect, useMemo } from 'react'
import { Bell, ChevronDown, ChevronUp } from 'lucide-react'
import { storage } from '@/lib/storage'
import { usePrices } from '@/hooks/usePrices'
import { fmtCurrency } from '@/lib/utils'
import type { SeguimientoItem } from '@/lib/types'

/* ─── types ───────────────────────────────────── */
type AlertType = 'green' | 'yellow' | 'red'

interface PriceAlert {
  type: AlertType
  ticker: string
  message: string
  price: number
  zoneLabel: string
  zoneValue: string
  priority: number   // 0 = green (most relevant), 1 = yellow, 2 = red
}

/* ─── colors ──────────────────────────────────── */
const COLOR: Record<AlertType, string> = {
  green:  '#1D9E75',
  yellow: '#EF9F27',
  red:    '#E24B4A',
}

const BG: Record<AlertType, string> = {
  green:  'rgba(29,158,117,0.08)',
  yellow: 'rgba(239,159,39,0.08)',
  red:    'rgba(226,75,74,0.08)',
}

/* ─── alert computation ───────────────────────── */
function computeAlerts(
  items: SeguimientoItem[],
  prices: Record<string, number>,
): PriceAlert[] {
  const alerts: PriceAlert[] = []

  for (const item of items) {
    const price = prices[item.ticker]
    if (!price || price <= 0) continue

    const { ticker, entryZoneLow, entryZoneHigh, noPursueAbove } = item
    const hasZone = entryZoneHigh > 0

    // 🟢 Verde — in entry zone
    if (hasZone && price >= entryZoneLow && price <= entryZoneHigh) {
      alerts.push({
        type: 'green',
        ticker,
        message: 'llegó a zona de entrada',
        price,
        zoneLabel: 'Zona entrada',
        zoneValue: entryZoneLow > 0
          ? `${fmtCurrency(entryZoneLow)} – ${fmtCurrency(entryZoneHigh)}`
          : fmtCurrency(entryZoneHigh),
        priority: 0,
      })
      continue   // verde takes priority over amarillo for same ticker
    }

    // 🟡 Amarillo — within 10% above entry zone (approaching from above)
    if (hasZone && price > entryZoneHigh && price <= entryZoneHigh * 1.10) {
      const distPct = (((price - entryZoneHigh) / entryZoneHigh) * 100).toFixed(1)
      alerts.push({
        type: 'yellow',
        ticker,
        message: `se acerca a zona de entrada (${distPct}% sobre zona)`,
        price,
        zoneLabel: 'Zona entrada',
        zoneValue: entryZoneLow > 0
          ? `${fmtCurrency(entryZoneLow)} – ${fmtCurrency(entryZoneHigh)}`
          : fmtCurrency(entryZoneHigh),
        priority: 1,
      })
      // don't continue — also check rojo below
    }

    // 🔴 Rojo — above no-pursue level
    if (noPursueAbove > 0 && price >= noPursueAbove) {
      alerts.push({
        type: 'red',
        ticker,
        message: 'superó zona de no perseguir',
        price,
        zoneLabel: 'No perseguir sobre',
        zoneValue: fmtCurrency(noPursueAbove),
        priority: 2,
      })
    }
  }

  // Sort: green first, then yellow, then red
  return alerts.sort((a, b) => a.priority - b.priority)
}

/* ─── alert row ───────────────────────────────── */
function AlertRow({ alert }: { alert: PriceAlert }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5"
      style={{ borderLeft: `3px solid ${COLOR[alert.type]}` }}
    >
      {/* Dot */}
      <div
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: COLOR[alert.type] }}
      />

      {/* Ticker + message */}
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {alert.ticker}
        </span>
        <span className="ml-1.5 text-sm text-slate-500 dark:text-slate-400">
          {alert.message}
        </span>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <p
          className="text-sm font-semibold tabular-nums"
          style={{ color: COLOR[alert.type] }}
        >
          {fmtCurrency(alert.price)}
        </p>
        <p className="text-[10px] text-slate-400">
          {alert.zoneLabel}: {alert.zoneValue}
        </p>
      </div>
    </div>
  )
}

/* ─── main component ──────────────────────────── */
export function AlertsPanel() {
  const [items, setItems] = useState<SeguimientoItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setItems(storage.getSeguimiento())
    setMounted(true)
  }, [])

  const tickers = useMemo(
    () => [...new Set(items.map((i) => i.ticker))],
    [items],
  )

  const { prices } = usePrices(mounted ? tickers : [])

  const alerts = useMemo(
    () => computeAlerts(items, prices),
    [items, prices],
  )

  // No alerts → render nothing (zero space)
  if (alerts.length === 0) return null

  const MAX = 3
  const visible = expanded ? alerts : alerts.slice(0, MAX)
  const hiddenCount = alerts.length - MAX

  // Header accent: use the highest-priority alert type
  const topType = alerts[0].type
  const headerBg: Record<AlertType, string> = {
    green:  'rgba(29,158,117,0.06)',
    yellow: 'rgba(239,159,39,0.06)',
    red:    'rgba(226,75,74,0.06)',
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: headerBg[topType] }}
      >
        <div className="flex items-center gap-2">
          <Bell size={13} style={{ color: COLOR[topType] }} />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Alertas de precio
          </span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: COLOR[topType] + '20',
            color: COLOR[topType],
          }}
        >
          {alerts.length} activa{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Alert rows */}
      <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
        {visible.map((alert, i) => (
          <AlertRow key={`${alert.ticker}-${alert.type}-${i}`} alert={alert} />
        ))}
      </div>

      {/* Ver todas / Ocultar */}
      {alerts.length > MAX && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-slate-50 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:border-slate-800/40 dark:hover:bg-slate-800/30"
        >
          {expanded ? (
            <>
              <ChevronUp size={12} />
              Ocultar
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              Ver {hiddenCount} alerta{hiddenCount !== 1 ? 's' : ''} más
            </>
          )}
        </button>
      )}
    </div>
  )
}
