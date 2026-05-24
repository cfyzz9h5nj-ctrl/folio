import type { Holding } from './types'

export interface HoldingWithMetrics extends Holding {
  currentPrice: number
  currentValue: number
  pnl: number
  pnlPct: number
  weight: number
}

export function computeHoldings(
  holdings: Holding[],
  prices: Record<string, number>,
): HoldingWithMetrics[] {
  const totalValue = holdings.reduce((sum, h) => {
    return sum + h.shares * (prices[h.ticker] ?? h.avgPrice)
  }, 0)

  return holdings.map((h) => {
    const currentPrice = prices[h.ticker] ?? h.avgPrice
    const currentValue = h.shares * currentPrice
    const pnl = currentValue - h.invested
    const pnlPct = h.invested > 0 ? (pnl / h.invested) * 100 : 0
    const weight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0
    return { ...h, currentPrice, currentValue, pnl, pnlPct, weight }
  })
}

export function totalPortfolioValue(
  holdings: Holding[],
  prices: Record<string, number>,
): number {
  return holdings.reduce((sum, h) => sum + h.shares * (prices[h.ticker] ?? h.avgPrice), 0)
}

export function totalInvested(holdings: Holding[]): number {
  return holdings.reduce((sum, h) => sum + h.invested, 0)
}

export function totalPnL(holdings: Holding[], prices: Record<string, number>): number {
  return totalPortfolioValue(holdings, prices) - totalInvested(holdings)
}
