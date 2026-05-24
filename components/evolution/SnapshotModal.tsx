'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CapitalHistory } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultContributed: number
  defaultPortfolioValue: number
  onSave: (entry: CapitalHistory) => void
}

export function SnapshotModal({
  open,
  onOpenChange,
  defaultContributed,
  defaultPortfolioValue,
  onSave,
}: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [contributed, setContributed] = useState(defaultContributed)
  const [portfolioValue, setPortfolioValue] = useState(defaultPortfolioValue)

  useEffect(() => {
    if (open) {
      setDate(today)
      setContributed(defaultContributed)
      setPortfolioValue(defaultPortfolioValue)
    }
  }, [open, defaultContributed, defaultPortfolioValue, today])

  const handleSave = () => {
    onSave({ date, contributed: Number(contributed), portfolioValue: Number(portfolioValue) })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Registrar snapshot"
        description="Guardá el estado del portfolio hoy. Los valores están pre-completados, podés ajustarlos."
      >
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="snap-date">Fecha</Label>
            <Input
              id="snap-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="snap-contributed">Capital aportado acumulado (USD)</Label>
            <Input
              id="snap-contributed"
              type="number"
              step="any"
              value={contributed}
              onChange={(e) => setContributed(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="snap-portfolio">Valor portfolio (USD)</Label>
            <Input
              id="snap-portfolio"
              type="number"
              step="any"
              value={portfolioValue}
              onChange={(e) => setPortfolioValue(Number(e.target.value))}
            />
          </div>
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: portfolioValue - contributed >= 0 ? '#f0fdf4' : '#fef2f2',
              color: portfolioValue - contributed >= 0 ? '#166534' : '#991b1b',
            }}
          >
            Retorno: {portfolioValue - contributed >= 0 ? '+' : ''}
            {(portfolioValue - contributed).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}{' '}
            (
            {contributed > 0
              ? `${(((portfolioValue - contributed) / contributed) * 100).toFixed(2)}%`
              : '—'}
            )
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave}>Guardar snapshot</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
