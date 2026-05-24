export interface Holding {
  id: string
  ticker: string
  shares: number
  avgPrice: number
  invested: number
  purchaseDate: string | null
  notes: string
  addedAt: string
}

export interface CashAllocation {
  label: string
  amount: number
}

export interface Cash {
  total: number
  reserve: number
  contributed: number
  allocations: CashAllocation[]
}

export interface CapitalHistory {
  date: string
  contributed: number
  portfolioValue: number
}

export interface WatchlistItem {
  id: string
  ticker: string
  name: string
  entryZoneLow: number
  entryZoneHigh: number
  cashAllocated: number
  notes: string
}

export interface Contribution {
  id: string
  date: string        // YYYY-MM-DD
  amount: number
  description: string
}

export interface Company {
  id: string
  ticker: string
  name: string
  score: number
  verdict: string
  thesis: string
  entryReasonable: number       // entry zone reasonable – low bound
  entryReasonableHigh?: number  // entry zone reasonable – high bound
  entryIdeal: number            // entry zone ideal – low bound
  entryIdealHigh?: number       // entry zone ideal – high bound
  noPursueAbove: number
  target: number
  invalidation: string          // fundamental invalidation (text)
  technicalInvalidation?: number // technical invalidation price level
  nextReview: string
  notes: string
  status: string                // 'portfolio' | 'watchlist'
  updatedAt: string
  catalysts?: string
  semaphore?: string            // 'verde' | 'amarillo' | 'rojo'
  cashAllocated?: number
  portfolioPct?: number
}

export interface SeguimientoItem {
  id: string
  ticker: string
  name: string
  // Analysis
  score: number
  verdict: string
  thesis: string
  catalysts?: string
  invalidation: string
  // Entry zones — high used for semaphore logic
  entryZoneLow: number
  entryZoneHigh: number
  entryIdealLow: number
  entryIdealHigh: number
  noPursueAbove: number
  technicalInvalidation?: number
  target: number
  // Sizing
  cashAllocated: number
  portfolioPct?: number
  // Meta
  status: string       // 'portfolio' | 'watchlist'
  nextReview: string
  notes: string
  updatedAt: string
  // GPT dashboard image (base64)
  image?: string
}
