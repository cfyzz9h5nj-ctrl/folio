'use client'

import { useEffect, useState } from 'react'

export interface SPYCandle {
  date: string  // YYYY-MM-DD
  close: number
}

/**
 * Fetches daily SPY candles from Finnhub for the period starting at `fromDate`
 * until today. Returns an array sorted ascending by date.
 *
 * Returns empty array (and loading=false) when `fromDate` is null.
 */
export function useSPYCandles(fromDate: string | null) {
  const [candles, setCandles] = useState<SPYCandle[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!fromDate) return

    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_KEY
    if (!apiKey) return

    let cancelled = false
    setLoading(true)

    // Finnhub expects Unix seconds
    const fromTs = Math.floor(new Date(fromDate + 'T00:00:00Z').getTime() / 1000)
    const toTs = Math.floor(Date.now() / 1000)

    fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=SPY&resolution=D&from=${fromTs}&to=${toTs}&token=${apiKey}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.s !== 'ok' || !Array.isArray(data.t)) {
          setCandles([])
          return
        }
        const result: SPYCandle[] = (data.t as number[]).map((ts, i) => ({
          date: new Date(ts * 1000).toISOString().slice(0, 10),
          close: (data.c as number[])[i],
        }))
        setCandles(result)
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
