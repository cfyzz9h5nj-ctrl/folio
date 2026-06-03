'use client'

import { useEffect, useState } from 'react'

export interface SPYCandle {
  date: string  // YYYY-MM-DD
  close: number
}

/**
 * Fetches daily SPY candles via the internal Next.js proxy route
 * (/api/spy-candles), which fetches from Yahoo Finance server-side
 * to avoid browser CORS restrictions. No API key required.
 *
 * Returns empty array (and loading=false) when `fromDate` is null.
 */
export function useSPYCandles(fromDate: string | null) {
  const [candles, setCandles] = useState<SPYCandle[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!fromDate) return

    let cancelled = false
    setLoading(true)

    const fromTs = Math.floor(new Date(fromDate + 'T00:00:00Z').getTime() / 1000)
    const toTs   = Math.floor(Date.now() / 1000)

    fetch(`/api/spy-candles?from=${fromTs}&to=${toTs}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: { candles?: SPYCandle[] }) => {
        if (cancelled) return
        setCandles(data.candles ?? [])
      })
      .catch(() => {
        if (!cancelled) setCandles([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [fromDate])

  return { candles, loading }
}

/** Returns the close price of the nearest candle on or before `date` (YYYY-MM-DD). */
export function findSPYClose(candles: SPYCandle[], date: string): number | null {
  let best: number | null = null
  for (const c of candles) {
    if (c.date <= date) best = c.close
    else break
  }
  return best
}
