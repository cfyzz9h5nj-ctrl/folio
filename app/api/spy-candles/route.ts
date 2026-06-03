import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side proxy for SPY historical daily candles from Yahoo Finance.
 * Avoids browser CORS restrictions since this runs on the server.
 *
 * GET /api/spy-candles?from=UNIX_TIMESTAMP&to=UNIX_TIMESTAMP
 * Returns: { candles: Array<{ date: string; close: number }> }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&period1=${from}&period2=${to}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json',
        },
        // 10-second timeout via AbortSignal
        signal: AbortSignal.timeout(10_000),
      },
    )

    if (!res.ok) {
      return NextResponse.json({ error: `Yahoo Finance ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const result = data?.chart?.result?.[0]

    if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) {
      return NextResponse.json({ candles: [] })
    }

    const timestamps: number[]          = result.timestamp
    const closes: (number | null)[]     = result.indicators.quote[0].close

    const candles = timestamps
      .map((ts, i) => ({
        date:  new Date(ts * 1000).toISOString().slice(0, 10),
        close: closes[i] ?? 0,
      }))
      .filter((c) => c.close > 0)

    return NextResponse.json({ candles })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch SPY data' }, { status: 502 })
  }
}
