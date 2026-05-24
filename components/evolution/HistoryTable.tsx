import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmtCurrency } from '@/lib/utils'
import type { CapitalHistory } from '@/lib/types'

interface Props {
  history: CapitalHistory[]
  onDelete: (index: number) => void
}

export function HistoryTable({ history, onDelete }: Props) {
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Card>
      <CardHeader><CardTitle>Historial de snapshots</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Fecha', 'Monto ese período', 'Total aportado', 'Valor portfolio', 'Diferencia', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Sin snapshots registrados
                  </td>
                </tr>
              )}
              {sorted.map((entry, i) => {
                const originalIndex = history.findIndex((h) => h.date === entry.date && h.contributed === entry.contributed)
                const prev = sorted[i + 1]
                const periodAmount = prev ? entry.contributed - prev.contributed : entry.contributed
                const diff = entry.portfolioValue - entry.contributed
                return (
                  <tr
                    key={`${entry.date}-${i}`}
                    className="border-b border-slate-50 last:border-0 dark:border-slate-800/50"
                  >
                    <td className="px-5 py-3 font-medium tabular-nums">{entry.date}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-500">
                      {periodAmount > 0 ? '+' : ''}{fmtCurrency(periodAmount)}
                    </td>
                    <td className="px-5 py-3 tabular-nums">{fmtCurrency(entry.contributed)}</td>
                    <td className="px-5 py-3 tabular-nums">{fmtCurrency(entry.portfolioValue)}</td>
                    <td
                      className="px-5 py-3 tabular-nums font-medium"
                      style={{ color: diff >= 0 ? '#1D9E75' : '#E24B4A' }}
                    >
                      {diff >= 0 ? '+' : ''}{fmtCurrency(diff)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => onDelete(originalIndex)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-[#E24B4A] dark:hover:bg-red-950/30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
