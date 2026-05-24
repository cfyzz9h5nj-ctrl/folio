import type { Holding, Cash, CapitalHistory, WatchlistItem, Company, Contribution, SeguimientoItem } from './types'

const KEYS = {
  holdings: 'portfolio_holdings',
  cash: 'portfolio_cash',
  capitalHistory: 'portfolio_capital_history',
  watchlist: 'portfolio_watchlist',
  companies: 'portfolio_companies',
  contributions: 'portfolio_contributions',
  seguimiento: 'portfolio_seguimiento',
} as const

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export const storage = {
  getHoldings: (): Holding[] => get(KEYS.holdings, []),
  setHoldings: (v: Holding[]) => set(KEYS.holdings, v),

  getCash: (): Cash => {
    const raw = get<Partial<Cash>>(KEYS.cash, {})
    return {
      total: raw.total ?? 0,
      reserve: raw.reserve ?? 400,
      contributed: raw.contributed ?? 0,
      allocations: raw.allocations ?? [],
    }
  },
  setCash: (v: Cash) => set(KEYS.cash, v),

  getCapitalHistory: (): CapitalHistory[] => get(KEYS.capitalHistory, []),
  setCapitalHistory: (v: CapitalHistory[]) => set(KEYS.capitalHistory, v),

  getWatchlist: (): WatchlistItem[] => get(KEYS.watchlist, []),
  setWatchlist: (v: WatchlistItem[]) => set(KEYS.watchlist, v),

  getCompanies: (): Company[] => get(KEYS.companies, []),
  setCompanies: (v: Company[]) => set(KEYS.companies, v),

  getContributions: (): Contribution[] => get(KEYS.contributions, []),
  setContributions: (v: Contribution[]) => set(KEYS.contributions, v),

  getSeguimiento: (): SeguimientoItem[] => get(KEYS.seguimiento, []),
  setSeguimiento: (v: SeguimientoItem[]) => set(KEYS.seguimiento, v),

  /** One-time migration: merges portfolio_companies + portfolio_watchlist → portfolio_seguimiento */
  migrateSeguimiento: (): SeguimientoItem[] => {
    const existing = get<SeguimientoItem[]>(KEYS.seguimiento, [])
    if (existing.length > 0) return existing

    const companies = get<Company[]>(KEYS.companies, [])
    const watchlist = get<WatchlistItem[]>(KEYS.watchlist, [])

    const merged: SeguimientoItem[] = companies.map((c) => ({
      id: c.id,
      ticker: c.ticker,
      name: c.name,
      score: c.score,
      verdict: c.verdict,
      thesis: c.thesis,
      catalysts: c.catalysts,
      invalidation: c.invalidation,
      entryZoneLow: c.entryReasonable ?? 0,
      entryZoneHigh: c.entryReasonableHigh ?? c.entryReasonable ?? 0,
      entryIdealLow: c.entryIdeal ?? 0,
      entryIdealHigh: c.entryIdealHigh ?? c.entryIdeal ?? 0,
      noPursueAbove: c.noPursueAbove ?? 0,
      technicalInvalidation: c.technicalInvalidation,
      target: c.target ?? 0,
      cashAllocated: c.cashAllocated ?? 0,
      portfolioPct: c.portfolioPct,
      status: c.status ?? 'watchlist',
      nextReview: c.nextReview ?? '',
      notes: c.notes ?? '',
      updatedAt: c.updatedAt ?? new Date().toISOString(),
    }))

    const companyTickers = new Set(companies.map((c) => c.ticker))

    for (const w of watchlist) {
      if (!companyTickers.has(w.ticker)) {
        merged.push({
          id: w.id,
          ticker: w.ticker,
          name: w.name,
          score: 70,
          verdict: 'Observar',
          thesis: '',
          catalysts: undefined,
          invalidation: '',
          entryZoneLow: w.entryZoneLow,
          entryZoneHigh: w.entryZoneHigh,
          entryIdealLow: 0,
          entryIdealHigh: 0,
          noPursueAbove: 0,
          target: 0,
          cashAllocated: w.cashAllocated,
          status: 'watchlist',
          nextReview: '',
          notes: w.notes ?? '',
          updatedAt: new Date().toISOString(),
        })
      }
    }

    if (merged.length > 0) set(KEYS.seguimiento, merged)
    return merged
  },

  getMonthlyCapital: (): number => get('portfolio_monthly_capital', 800),
  setMonthlyCapital: (v: number) => set('portfolio_monthly_capital', v),
}
