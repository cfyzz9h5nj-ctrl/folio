import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmtCurrency, fmtPct } from '@/lib/utils'
import type { HoldingWithMetrics } from '@/lib/calculations'

interface Props {
  holdings: HoldingWithMetrics[]
  loading?: boolean
}

export function DashboardPositionsTable({ holdings, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Posiciones</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Ticker', 'Precio Prom.', 'Precio Actual', 'P&L %', 'Peso'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Cargando precios…
                  </td>
                </tr>
              )}
              {!loading && holdings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Sin posiciones. Añadí desde Posiciones.
                  </td>
                </tr>
              )}
              {[...holdings].sort((a, b) => b.weight - a.weight).map((h) => (
                <tr
                  key={h.id}
                  className="border-b border-slate-50 last:border-0 dark:border-slate-800/50"
                >
                  <td className="px-5 py-3 font-medium">{h.ticker}</td>
                  <td className="px-5 py-3 tabular-nums text-slate-500">{fmtCurrency(h.avgPrice)}</td>
                  <td className="px-5 py-3 tabular-nums">{fmtCurrency(h.currentPrice)}</td>
                  <td
                    className="px-5 py-3 tabular-nums font-medium"
                    style={{ color: h.pnlPct >= 0 ? '#1D9E75' : '#E24B4A' }}
                  >
                    {fmtPct(h.pnlPct)}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-slate-500">{h.weight.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
