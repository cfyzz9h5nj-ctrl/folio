'use client'

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmtCurrency } from '@/lib/utils'
import type { CapitalHistory } from '@/lib/types'

interface Props {
  history: CapitalHistory[]
  /** Capital aportado al broker — dibujado como línea punteada plana */
  baseline?: number
}

function formatXAxis(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es', { month: 'short', year: '2-digit' })
}

function formatYAxis(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
  return `$${value}`
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const portfolio = payload.find((p) => p.dataKey === 'portfolioValue')?.value ?? 0
  const contributed = payload.find((p) => p.dataKey === 'contributed')?.value ?? 0
  const diff = portfolio - contributed
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-2 font-medium text-slate-700 dark:text-slate-300">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-8">
          <span className="text-slate-500">Portfolio</span>
          <span className="tabular-nums font-medium text-[#378ADD]">{fmtCurrency(portfolio)}</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-slate-500">Aportado</span>
          <span className="tabular-nums text-slate-600 dark:text-slate-400">{fmtCurrency(contributed)}</span>
        </div>
        <div className="flex justify-between gap-8 border-t border-slate-100 pt-1 dark:border-slate-700">
          <span className="text-slate-500">Diferencia</span>
          <span
            className="tabular-nums font-semibold"
            style={{ color: diff >= 0 ? '#1D9E75' : '#E24B4A' }}
          >
            {diff >= 0 ? '+' : ''}{fmtCurrency(diff)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function EvolutionChart({ history, baseline }: Props) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Evolución del portfolio</CardTitle></CardHeader>
        <CardContent className="flex h-72 items-center justify-center text-sm text-slate-400">
          Registrá el primer snapshot para ver el gráfico
        </CardContent>
      </Card>
    )
  }

  const data = history.map((h) => ({
    date: formatXAxis(h.date),
    portfolioValue: h.portfolioValue,
    // Si hay baseline (cash.contributed), usar ese valor plano; si no, el del snapshot
    contributed: baseline ?? h.contributed,
  }))

  return (
    <Card>
      <CardHeader><CardTitle>Evolución del portfolio</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#378ADD" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-100, #f1f5f9)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="plainline"
              iconSize={16}
              formatter={(value) => (
                <span className="text-xs text-slate-500">
                  {value === 'portfolioValue' ? 'Valor portfolio' : 'Capital aportado'}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="portfolioValue"
              stroke="#378ADD"
              strokeWidth={2}
              fill="url(#portfolioGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#378ADD' }}
            />
            <Line
              type="monotone"
              dataKey="contributed"
              stroke="#888780"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 3, fill: '#888780' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
