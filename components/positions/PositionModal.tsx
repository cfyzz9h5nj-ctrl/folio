'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateId } from '@/lib/utils'
import type { Holding } from '@/lib/types'

function today() {
  return new Date().toISOString().slice(0, 10)
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  holding?: Holding | null
  onSave: (h: Holding) => void
}

const empty = () => ({
  ticker: '',
  shares: 0,
  avgPrice: 0,
  purchaseDate: today(),
  notes: '',
})

export function PositionModal({ open, onOpenChange, holding, onSave }: Props) {
  const [form, setForm] = useState(empty())

  useEffect(() => {
    if (holding) {
      setForm({
        ticker: holding.ticker,
        shares: holding.shares,
        avgPrice: holding.avgPrice,
        purchaseDate: holding.purchaseDate ?? today(),
        notes: holding.notes,
      })
    } else {
      setForm(empty())
    }
  }, [holding, open])

  const set = (field: keyof typeof form, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const shares = Number(form.shares)
  const avgPrice = Number(form.avgPrice)
  const invested = shares * avgPrice

  const handleSave = () => {
    if (!form.ticker.trim()) return
    const h: Holding = {
      id: holding?.id ?? generateId(),
      addedAt: holding?.addedAt ?? new Date().toISOString(),
      ticker: form.ticker.toUpperCase().trim(),
      shares,
      avgPrice,
      invested,
      purchaseDate: form.purchaseDate || null,
      notes: form.notes,
    }
    onSave(h)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={holding ? 'Editar posición' : 'Nueva posición'}
        description="Completá los datos de la posición."
      >
        <div className="mt-4 space-y-4">
          {/* Ticker */}
          <div className="space-y-1.5">
            <Label htmlFor="ticker">Ticker</Label>
            <Input
              id="ticker"
              placeholder="AAPL"
              value={form.ticker}
              onChange={(e) => set('ticker', e.target.value.toUpperCase())}
            />
          </div>

          {/* Acciones + Precio promedio */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="shares">Acciones</Label>
              <Input
                id="shares"
                type="number"
                step="any"
                placeholder="0"
                value={form.shares || ''}
                onChange={(e) => set('shares', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avgPrice">Precio promedio (USD)</Label>
              <Input
                id="avgPrice"
                type="number"
                step="any"
                placeholder="0.00"
                value={form.avgPrice || ''}
                onChange={(e) => set('avgPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Capital invertido — calculado, solo lectura */}
          {invested > 0 && (
            <p className="text-xs text-slate-500">
              Capital invertido:{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                ${invested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          )}

          {/* Fecha de primera compra */}
          <div className="space-y-1.5">
            <Label htmlFor="purchaseDate">Fecha de primera compra</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={form.purchaseDate}
              onChange={(e) => set('purchaseDate', e.target.value)}
            />
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Tesis, contexto…"
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 resize-none"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={!form.ticker.trim()}>
              {holding ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
