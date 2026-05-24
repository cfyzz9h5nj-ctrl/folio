'use client'

import { useEffect, useRef, useState } from 'react'
import { storage } from '@/lib/storage'
import { usePrices } from '@/hooks/usePrices'
import type { Holding } from '@/lib/types'

// Bump this key to force a one-time history reset on next app load
const RESET_FLAG = 'portfolio_history_reset_v2'

export function AutoSnapshot() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [mounted, setMounted] = useState(false)
  const saved = useRef(false)

  useEffect(() => {
    setHoldings(storage.getHoldings())
    setMounted(true)
  }, [])

  const tickers = [...new Set(holdings.map((h) => h.ticker))]
  const { prices, loading } = usePrices(mounted ? tickers : [])

  useEffect(() => {
    if (!mounted) return
    if (holdings.length === 0) return
    if (saved.current) return

    const today = new Date().toISOString().slice(0, 10)
    const cash = storage.getCash()
    const contribs = storage.getContributions()
    const contributed = contribs.reduce((s, c) => s + c.amount, 0)

    // ── One-time migration: runs immediately using avgPrice (no live price needed) ──
    if (!localStorage.getItem(RESET_FLAG)) {
      const positionsValue = holdings.reduce((sum, h) => sum + h.shares * h.avgPrice, 0)
      const portfolioValue = Math.round((positionsValue + cash.total) * 100) / 100
      storage.setCapitalHistory([{ date: today, contributed, portfolioValue }])
      localStorage.setItem(RESET_FLAG, 'true')
      saved.current = true
      return
    }

    // ── Normal daily snapshot: waits for live prices ──────────────────
    if (tickers.length > 0 && loading) return

    const history = storage.getCapitalHistory()
    if (history.some((h) => h.date === today)) {
      saved.current = true
      return
    }

    const positionsValue = holdings.reduce((sum, h) => {
      const price = prices[h.ticker] > 0 ? prices[h.ticker] : h.avgPrice
      return sum + h.shares * price
    }, 0)
    const portfolioValue = Math.round((positionsValue + cash.total) * 100) / 100

    const updated = [...history, { date: today, contributed, portfolioValue }]
      .sort((a, b) => a.date.localeCompare(b.date))

    storage.setCapitalHistory(updated)
    saved.current = true
  }, [mounted, loading, holdings, prices, tickers.length])

  return null
}
