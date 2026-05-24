'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

export function usePrices(tickers: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tickersKey = tickers.slice().sort().join(',')
  const prevKey = useRef('')

  const fetchPrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_KEY
    if (!apiKey) {
      setError('NEXT_PUBLIC_FINNHUB_KEY not set')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.all(
        symbols.map(async (ticker) => {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`,
          )
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          return [ticker, data.c as number] as const
        }),
      )
      setPrices((prev) => ({
        ...prev,
        ...Object.fromEntries(results.filter(([, price]) => price > 0)),
      }))
    } catch {
      setError('Failed to fetch prices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tickersKey === prevKey.current) return
    prevKey.current = tickersKey
    if (tickers.length > 0) fetchPrices(tickers)
  }, [tickersKey, fetchPrices])

  return { prices, loading, error, refetch: () => fetchPrices(tickers) }
}
