'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HoldingWithMetrics } from '@/lib/calculations'

const COLORS = [
  '#378ADD', '#1D9E75', '#EF9F27', '#E24B4A',
  '#6366f1', '#ec4899', '#14b8a6', '#f97316',
  '#8b5cf6', '#06b6d4',
]

interface Props {
  holdings: HoldingWithMetrics[]
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md dark:border-slate-800 dark:bg-slate-900">
      <p className="font-medium">{d.name}</p>
      <p className="text-slate-500">{d.value.toFixed(1)}%</p>
    </div>
  )
}

export function PortfolioChart({ holdings }: Props) {
  const data = holdings.map((h) => ({ name: h.ticker, value: parseFloat(h.weight.toFixed(1)) }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Composición</CardTitle></CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-sm text-slate-400">
          Sin posiciones
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle>Composición</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
