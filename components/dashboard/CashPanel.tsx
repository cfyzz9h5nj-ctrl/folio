'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmtCurrency } from '@/lib/utils'
import type { Cash } from '@/lib/types'

interface Props {
  cash: Cash
  portfolioValue: number
  onSave: (updated: Cash) => void
}

function EditableRow({
  label,
  value,
  onSave,
  valueColor,
}: {
  label: string
  value: number
  onSave: (v: number) => void
  valueColor?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const start = () => {
    setDraft(String(value))
    setEditing(true)
  }

  const commit = () => {
    const parsed = parseFloat(draft.replace(/,/g, ''))
    if (!isNaN(parsed)) onSave(parsed)
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      {editing ? (
        <input
          autoFocus
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="w-36 text-right font-semibold tabular-nums bg-transparent border-b border-[#378ADD] outline-none text-slate-900 dark:text-slate-100"
        />
      ) : (
        <button
          onClick={start}
          title="Click para editar"
          style={valueColor ? { color: valueColor } : undefined}
          className="group flex items-center gap-1.5 font-semibold tabular-nums text-slate-900 dark:text-slate-100 hover:text-[#378ADD] dark:hover:text-[#378ADD] transition-colors border-b border-dashed border-slate-300 dark:border-slate-600 hover:border-[#378ADD]"
        >
          {fmtCurrency(value)}
          <Pencil size={10} className="opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
        </button>
      )}
    </div>
  )
}

export function CashPanel({ cash, portfolioValue, onSave }: Props) {
  const totalWealth = portfolioValue + cash.total
  const reserve = cash.reserve ?? 400
  const contributed = cash.contributed ?? 0
  const free = cash.total - reserve
  const rendimiento = contributed > 0 ? ((totalWealth - contributed) / contributed) * 100 : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liquidez</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total disponible — synced with metric card */}
        <EditableRow
          label="Total disponible"
          value={cash.total}
          onSave={(v) => onSave({ ...cash, total: v })}
        />

        {/* Reserva mínima */}
        <EditableRow
          label="Reserva mínima"
          value={reserve}
          onSave={(v) => onSave({ ...cash, reserve: v })}
        />

        {/* Libre para invertir */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Libre para invertir
          </span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: free >= 0 ? '#1D9E75' : '#E24B4A' }}
          >
            {fmtCurrency(free)}
          </span>
        </div>

        {/* Capital aportado al broker */}
        <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
          <EditableRow
            label="Capital aportado al broker"
            value={contributed}
            onSave={(v) => onSave({ ...cash, contributed: v })}
          />
        </div>

        {/* Rendimiento real */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-sm text-slate-500">Rendimiento real</span>
          <span
            className="font-semibold tabular-nums"
            style={{
              color:
                rendimiento === null
                  ? '#94a3b8'
                  : rendimiento >= 0
                  ? '#1D9E75'
                  : '#E24B4A',
            }}
          >
            {rendimiento === null
              ? '—'
              : `${rendimiento >= 0 ? '+' : ''}${rendimiento.toFixed(2)}%`}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
