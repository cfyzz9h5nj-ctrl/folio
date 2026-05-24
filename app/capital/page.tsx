'use client'

import { useState, useEffect } from 'react'
import { storage } from '@/lib/storage'
import { computeHoldings, totalPortfolioValue } from '@/lib/calculations'
import { usePrices } from '@/hooks/usePrices'
import { generateId } from '@/lib/utils'
import { ContributionsPanel } from '@/components/dashboard/ContributionsPanel'
import type { Holding, Cash, Contribution } from '@/lib/types'

export default function CapitalPage() {
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

  const tickers = [...new Set(holdings.map((h) => h.ticker))]
  const { prices } = usePrices(mounted ? tickers : [])

  const computed = computeHoldings(holdings, prices)
  const portfolioValue = totalPortfolioValue(holdings, prices)
  const totalValue = portfolioValue + cash.total

  const handleSave = (updated: Contribution[]) => {
    setContributions(updated)
    storage.setContributions(updated)
  }

  const total = contributions.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Capital aportado</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {contributions.length} aporte{contributions.length !== 1 ? 's' : ''} · Total acumulado
        </p>
      </div>

      <ContributionsPanel
        contributions={contributions}
        totalValue={totalValue}
        onSave={handleSave}
      />
    </div>
  )
}
