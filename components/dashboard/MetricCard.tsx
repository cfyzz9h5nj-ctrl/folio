'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string
  sub?: string
  /** Extra smaller line below sub — for secondary metrics */
  note?: string
  trend?: 'positive' | 'negative' | 'neutral'
  /** Raw numeric value — required when onEdit is provided */
  rawValue?: number
  /** If provided, the value becomes click-to-edit inline */
  onEdit?: (val: number) => void
}

export function MetricCard({ title, value, sub, note, trend, rawValue, onEdit }: MetricCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const startEdit = () => {
    if (!onEdit) return
    setDraft(String(rawValue ?? 0))
    setEditing(true)
  }

  const commit = () => {
    const parsed = parseFloat(draft.replace(/,/g, ''))
    if (!isNaN(parsed) && onEdit) onEdit(parsed)
    setEditing(false)
  }

  const colorClass = cn(
    trend === 'positive' && 'text-[#1D9E75]',
    trend === 'negative' && 'text-[#E24B4A]',
    (!trend || trend === 'neutral') && 'text-slate-900 dark:text-slate-100',
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="w-full text-2xl font-semibold tabular-nums tracking-tight bg-transparent border-b-2 border-[#378ADD] outline-none text-slate-900 dark:text-slate-100"
          />
        ) : (
          <p
            onClick={startEdit}
            className={cn(
              'text-2xl font-semibold tabular-nums tracking-tight',
              colorClass,
              onEdit && 'cursor-pointer rounded hover:opacity-70 transition-opacity',
            )}
          >
            {value}
          </p>
        )}
        {sub && !editing && (
          <p className={cn('mt-1 text-sm', colorClass)}>{sub}</p>
        )}
        {note && !editing && (
          <p className="mt-0.5 text-xs text-slate-400">{note}</p>
        )}
        {onEdit && !editing && (
          <p className="mt-1 text-xs text-slate-400">click para editar</p>
        )}
      </CardContent>
    </Card>
  )
}
