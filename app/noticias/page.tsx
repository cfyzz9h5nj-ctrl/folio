'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink } from 'lucide-react'
import { storage } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ─── types ───────────────────────────────────────────── */
interface RawNews {
  id: number
  datetime: number   // unix seconds
  headline: string
  source: string
  url: string
  image: string
  summary: string
}

interface NewsItem extends RawNews {
  ticker: string
  inPortfolio: boolean
}

/* ─── helpers ─────────────────────────────────────────── */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmtDatetime(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const MAX_PER_TICKER = 5
const MAX_TOTAL = 60

/* ─── Thumbnail ───────────────────────────────────────── */
// Shows ticker initials by default. Only replaces with the real
// image if it loads AND is large enough (≥150 px wide) — this
// filters out small generic logos (Yahoo/Finnhub ~96 px).
function Thumbnail({
  image,
  ticker,
  inPortfolio,
}: {
  image: string
  ticker: string
  inPortfolio: boolean
}) {
  const [showImg, setShowImg] = useState(false)
  const initials = ticker.slice(0, 2).toUpperCase()

  return (
    <div className="relative hidden h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg sm:block">
      {/* Initials fallback — always underneath */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center text-base font-bold',
          inPortfolio
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
        )}
      >
        {initials}
      </div>

      {/* Real article image — shown only when it loads and is big enough */}
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-200',
            showImg ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={(e) => {
            const el = e.target as HTMLImageElement
            // Real article images are tall enough; filter out thin banners/logos (e.g. 354×50)
            if (el.naturalWidth >= 200 && el.naturalHeight >= 100) setShowImg(true)
          }}
          onError={() => setShowImg(false)}
        />
      )}
    </div>
  )
}

/* ─── page ────────────────────────────────────────────── */
export default function NoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('todos')
  const [tickers, setTickers] = useState<{ ticker: string; inPortfolio: boolean }[]>([])

  const fetchNews = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_KEY
    if (!apiKey) return

    const holdings = storage.getHoldings()
    const seguimiento = storage.getSeguimiento()

    const portfolioTickers = new Set(holdings.map((h) => h.ticker))
    const allTickerObjs: { ticker: string; inPortfolio: boolean }[] = [
      ...holdings.map((h) => ({ ticker: h.ticker, inPortfolio: true })),
      ...seguimiento
        .filter((s) => !portfolioTickers.has(s.ticker))
        .map((s) => ({ ticker: s.ticker, inPortfolio: false })),
    ]

    const seen = new Set<string>()
    const uniqueTickers = allTickerObjs.filter(({ ticker }) => {
      if (seen.has(ticker)) return false
      seen.add(ticker)
      return true
    })

    setTickers(uniqueTickers)
    if (uniqueTickers.length === 0) return

    setLoading(true)
    const from = daysAgo(14)
    const to = todayStr()

    const results = await Promise.allSettled(
      uniqueTickers.map(async ({ ticker, inPortfolio }) => {
        const url =
          `https://finnhub.io/api/v1/company-news` +
          `?symbol=${ticker}&from=${from}&to=${to}&token=${apiKey}`
        const res = await fetch(url)
        if (!res.ok) return []
        const data: RawNews[] = await res.json()
        return data
          .filter((n) => n.headline && n.url)
          .slice(0, MAX_PER_TICKER)
          .map((n): NewsItem => ({ ...n, ticker, inPortfolio }))
      })
    )

    const all: NewsItem[] = results
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, MAX_TOTAL)

    setNews(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const displayed = filter === 'todos' ? news : news.filter((n) => n.ticker === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Noticias</h1>
          <p className="mt-0.5 text-sm text-slate-500">Últimos 14 días · portfolio y watchlist</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchNews} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </Button>
      </div>

      {/* Ticker filter */}
      {tickers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('todos')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === 'todos'
                ? 'bg-[#378ADD] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
            )}
          >
            Todos
          </button>
          {tickers.map(({ ticker, inPortfolio }) => (
            <button
              key={ticker}
              onClick={() => setFilter(ticker)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filter === ticker
                  ? inPortfolio
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#378ADD] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
              )}
            >
              {ticker}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <p className="text-base">Sin noticias recientes</p>
          <p className="mt-1 text-sm">
            {tickers.length === 0
              ? 'Agregá posiciones o watchlist para ver noticias'
              : 'No se encontraron noticias en los últimos 14 días'}
          </p>
        </div>
      )}

      {/* News list */}
      {!loading && displayed.length > 0 && (
        <div className="space-y-3">
          {displayed.map((item) => (
            <a
              key={`${item.ticker}-${item.id}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
            >
              <Thumbnail
                image={item.image}
                ticker={item.ticker}
                inPortfolio={item.inPortfolio}
              />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                      item.inPortfolio
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
                    )}
                  >
                    {item.ticker}
                  </span>
                  <span className="text-xs text-slate-400">{fmtDatetime(item.datetime)}</span>
                </div>

                <p className="line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-[#378ADD] dark:text-slate-200">
                  {item.headline}
                </p>
              </div>

              {/* External link icon */}
              <ExternalLink
                size={14}
                className="mt-0.5 flex-shrink-0 text-slate-300 group-hover:text-[#378ADD] dark:text-slate-600"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
