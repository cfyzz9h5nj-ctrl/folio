'use client'

import { useState, useEffect } from 'react'
import { storage } from '@/lib/storage'
import { totalPortfolioValue } from '@/lib/calculations'
import { usePrices } from '@/hooks/usePrices'
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

  const pnl = totalValue - totalContributed
  const pnlPct = totalContributed > 0 ? (pnl / totalContributed) * 100 : 0

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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
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
      </div>

      {/* Chart — dotted line tracks portfolio_contributions total */}
      <EvolutionChart history={history} baseline={totalContributed} />

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
