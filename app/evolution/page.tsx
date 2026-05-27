'use client'

import { useState, useEffect, useMemo } from 'react'
import { storage } from '@/lib/storage'
import { usePrices } from '@/hooks/usePrices'
import { useSPYCandles, findSPYClose } from '@/hooks/useSPYCandles'
import { fmtCurrency, fmtPct } from '@/lib/utils'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EvolutionChart } from '@/components/evolution/EvolutionChart'
import { SnapshotModal } from '@/components/evolution/SnapshotModal'
import { HistoryTable } from '@/components/evolution/HistoryTable'
import type { Holding, CapitalHistory, Cash, Contribution } from '@/lib/types'

export default function EvolutionPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [history, setHistory] = useState<CapitalHistory[]>([])
  const [cash, setCash] = useState<Cash>({ total: 0, reserve: 400, contributed: 0, allocations: [] })
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [snapshotOpen, setSnapshotOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setHoldings(storage.getHoldings())
    setHistory(storage.getCapitalHistory())
    setCash(storage.getCash())
    setContributions(storage.getContributions())
    setMounted(true)
  }, [])

  const tickers = [...new Set(holdings.map((h) => h.ticker))]
  const { prices, loading } = usePrices(mounted ? tickers : [])

  // Total value = positions at live price (fallback avgPrice) + available cash
  const positionsValue = holdings.reduce((sum, h) => {
    const price = prices[h.ticker] > 0 ? prices[h.ticker] : h.avgPrice
    return sum + h.shares * price
  }, 0)
  const totalValue = positionsValue + cash.total

  // Contributed = sum of portfolio_contributions amounts
  const totalContributed = contributions.reduce((s, c) => s + c.amount, 0)

  const pnl    = totalValue - totalContributed
  const pnlPct = totalContributed > 0 ? (pnl / totalContributed) * 100 : 0

  // ─── SPY benchmark ────────────────────────────────────────────────────────
  // Start date = first snapshot in history (null if none yet)
  const spyFromDate = mounted && history.length > 0 ? history[0].date : null
  const { candles: spyCandles } = useSPYCandles(spyFromDate)

  // Initial capital invested at the time of the first snapshot
  // (use first snapshot's contributed, fall back to current totalContributed)
  const spyInitialCapital = history.length > 0
    ? (history[0].contributed || totalContributed)
    : totalContributed

  // SPY close price at the start date (first available candle on or after start)
  const spyStart = spyCandles.length > 0 ? spyCandles[0].close : null
  // SPY close price today (last available candle)
  const spyNow   = spyCandles.length > 0 ? spyCandles[spyCandles.length - 1].close : null

  // For each snapshot, compute what spyInitialCapital would be worth in SPY
  const spyValues = useMemo<(number | null)[]>(() => {
    if (!spyStart || spyCandles.length === 0) return history.map(() => null)
    return history.map((h) => {
      const close = findSPYClose(spyCandles, h.date)
      if (!close) return null
      return (close / spyStart) * spyInitialCapital
    })
  }, [history, spyCandles, spyStart, spyInitialCapital])

  // vs SPY percentage: my return% minus SPY return%
  const spyReturnPct = (spyStart && spyNow)
    ? ((spyNow - spyStart) / spyStart) * 100
    : null
  const vsSpyPct = (spyReturnPct !== null && totalContributed > 0)
    ? pnlPct - spyReturnPct
    : null

  // ─── Snapshot handlers ────────────────────────────────────────────────────
  const saveSnapshot = (entry: CapitalHistory) => {
    const updated = [...history, entry].sort((a, b) => a.date.localeCompare(b.date))
    setHistory(updated)
    storage.setCapitalHistory(updated)
  }

  const deleteSnapshot = (index: number) => {
    if (!confirm('¿Eliminar este snapshot?')) return
    const updated = history.filter((_, i) => i !== index)
    setHistory(updated)
    storage.setCapitalHistory(updated)
  }

  // Round to 2 decimals to avoid floating-point noise in the modal
  const totalValueRounded = Math.round(totalValue * 100) / 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Evolución</h1>
        <p className="mt-0.5 text-sm text-slate-500">Historial de capital y rendimiento</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          title="Capital aportado"
          value={fmtCurrency(totalContributed)}
          trend="neutral"
        />
        <MetricCard
          title="Valor actual"
          value={loading ? '…' : fmtCurrency(totalValue)}
          trend="neutral"
        />
        <MetricCard
          title="Retorno total"
          value={fmtCurrency(pnl)}
          sub={totalContributed > 0 ? fmtPct(pnlPct) : undefined}
          trend={pnl >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          title="vs SPY"
          value={
            vsSpyPct !== null
              ? `${vsSpyPct >= 0 ? '+' : ''}${vsSpyPct.toFixed(1)}% vs SPY`
              : '—'
          }
          sub={
            spyReturnPct !== null
              ? `SPY: ${spyReturnPct >= 0 ? '+' : ''}${spyReturnPct.toFixed(1)}%`
              : undefined
          }
          trend={vsSpyPct === null ? 'neutral' : vsSpyPct >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Chart — dotted line tracks portfolio_contributions total */}
      <EvolutionChart
        history={history}
        baseline={totalContributed}
        spyValues={spyValues}
      />

      {/* History table */}
      <HistoryTable history={history} onDelete={deleteSnapshot} />

      <SnapshotModal
        open={snapshotOpen}
        onOpenChange={setSnapshotOpen}
        defaultContributed={totalContributed}
        defaultPortfolioValue={totalValueRounded}
        onSave={saveSnapshot}
      />
    </div>
  )
}
