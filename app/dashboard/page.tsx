'use client'

import { useState, useEffect } from 'react'
import { storage } from '@/lib/storage'
import { computeHoldings } from '@/lib/calculations'
import { usePrices } from '@/hooks/usePrices'
import { fmtCurrency, fmtPct, generateId } from '@/lib/utils'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import { PortfolioChart } from '@/components/dashboard/PortfolioChart'
import { DashboardPositionsTable } from '@/components/dashboard/PositionsTable'
import type { Holding, Cash, Contribution } from '@/lib/types'

export default function DashboardPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [cash, setCash] = useState<Cash>({ total: 0, reserve: 400, contributed: 0, allocations: [] })
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setHoldings(storage.getHoldings())
    setCash(storage.getCash())

    const saved = storage.getContributions()
    if (saved.length === 0) {
      const seed: Contribution[] = [{
        id: generateId(),
        date: new Date().toISOString().slice(0, 10),
        amount: 4500,
        description: 'Aporte inicial',
      }]
      storage.setContributions(seed)
      setContributions(seed)
    } else {
      setContributions(saved)
    }

    setMounted(true)
  }, [])

  // Fetch live prices only after mount (localStorage data available)
  const tickers = [...new Set(holdings.map((h) => h.ticker))]
  const { prices, loading } = usePrices(mounted ? tickers : [])

  const computed = computeHoldings(holdings, prices)

  // portfolioValue: uses live price if available, falls back to avgPrice (never 0)
  const portfolioValue = holdings.reduce((sum, h) => {
    const price = prices[h.ticker] > 0 ? prices[h.ticker] : h.avgPrice
    return sum + h.shares * price
  }, 0)

  // Invested = suma de capital puesto (shares × avgPrice)
  const invested = holdings.reduce((sum, h) => sum + h.invested, 0)

  // Total value = posiciones valoradas + liquidez en cuenta
  const totalValue = portfolioValue + cash.total

  // P&L y rendimiento real vs capital aportado (portfolio_contributions)
  const totalContributed = contributions.reduce((s, c) => s + c.amount, 0)
  const realPnl = totalContributed > 0 ? totalValue - totalContributed : null
  const realPnlPct = totalContributed > 0
    ? ((totalValue - totalContributed) / totalContributed) * 100
    : null

  const handleCashSave = (updated: Cash) => {
    setCash(updated)
    storage.setCash(updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">Resumen del portfolio</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          title="Valor total"
          value={fmtCurrency(totalValue)}
          trend="neutral"
        />
        <MetricCard
          title="Invertido"
          value={fmtCurrency(invested)}
          trend="neutral"
        />
        <MetricCard
          title="Liquidez disponible"
          value={fmtCurrency(cash.total)}
          rawValue={cash.total}
          onEdit={(v) => handleCashSave({ ...cash, total: v })}
          trend="neutral"
        />
        <MetricCard
          title="P&L total"
          value={realPnl !== null ? fmtCurrency(realPnl) : '—'}
          sub={realPnlPct !== null ? fmtPct(realPnlPct) : undefined}
          trend={realPnl === null ? 'neutral' : realPnl >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Alerts panel — only renders when there are active alerts */}
      <AlertsPanel />

      {/* Pie chart — full width */}
      <PortfolioChart holdings={computed} />

      {/* Capital summary — two lines only */}
      {totalContributed > 0 && (
        <div className="flex items-center gap-8 rounded-lg border border-slate-100 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/50">
          <div>
            <p className="text-xs text-slate-400">Total aportado</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {fmtCurrency(totalContributed)}
            </p>
          </div>
          <div className="h-7 w-px bg-slate-100 dark:bg-slate-800" />
          <div>
            <p className="text-xs text-slate-400">Rendimiento real</p>
            <p
              className="mt-0.5 text-sm font-semibold tabular-nums"
              style={{
                color: realPnlPct === null
                  ? '#94a3b8'
                  : realPnlPct >= 0 ? '#1D9E75' : '#E24B4A',
              }}
            >
              {realPnlPct === null ? '—' : fmtPct(realPnlPct)}
            </p>
          </div>
        </div>
      )}

      {/* Positions table */}
      <DashboardPositionsTable holdings={computed} loading={loading && holdings.length > 0} />
    </div>
  )
}
