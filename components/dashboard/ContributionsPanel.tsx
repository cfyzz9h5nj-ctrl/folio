'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fmtCurrency, generateId } from '@/lib/utils'
import type { Contribution } from '@/lib/types'

interface Props {
  contributions: Contribution[]
  totalValue: number
  onSave: (updated: Contribution[]) => void
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function fmtDate(d: string) {
  const date = new Date(d + 'T12:00:00')
  const m = date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
  const cap = m.charAt(0).toUpperCase() + m.slice(1)
  const y = String(date.getFullYear()).slice(2)
  return `${cap} ${y}`
}

const emptyForm = () => ({ date: todayStr(), amount: '', description: '' })

export function ContributionsPanel({ contributions, totalValue, onSave }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const total = contributions.reduce((s, c) => s + c.amount, 0)
  const rendimiento = total > 0 ? ((totalValue - total) / total) * 100 : null
  const sorted = [...contributions].sort((a, b) => b.date.localeCompare(a.date))

  const openModal = () => {
    setForm(emptyForm())
    setModalOpen(true)
  }

  const handleAdd = () => {
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) return
    const item: Contribution = {
      id: generateId(),
      date: form.date,
      amount,
      description: form.description.trim(),
    }
    onSave([...contributions, item])
    setModalOpen(false)
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este aporte?')) return
    onSave(contributions.filter((c) => c.id !== id))
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Capital aportado</CardTitle>
            <Button size="sm" onClick={openModal}>
              <Plus size={14} />
              Agregar aporte
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {contributions.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              Sin aportes registrados.{' '}
              <button className="text-[#378ADD] hover:underline" onClick={openModal}>
                Agregá uno
              </button>
              .
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Fecha</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Monto</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Descripción</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-50 last:border-0 dark:border-slate-800/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(c.date)}</td>
                      <td className="px-5 py-3 tabular-nums font-medium">{fmtCurrency(c.amount)}</td>
                      <td className="px-5 py-3 text-slate-500">{c.description || <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-[#E24B4A] dark:hover:bg-red-950/30"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500">Total aportado</p>
                  <p className="text-base font-semibold tabular-nums">{fmtCurrency(total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Rendimiento real</p>
                  <p
                    className="text-base font-semibold tabular-nums"
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
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent title="Agregar aporte" description="Registrá un aporte de capital al broker.">
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cont-date">Fecha</Label>
                <Input
                  id="cont-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cont-amount">Monto (USD)</Label>
                <Input
                  id="cont-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cont-desc">Descripción (opcional)</Label>
              <Input
                id="cont-desc"
                placeholder="Aporte mensual, bono, transferencia…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleAdd}
                disabled={!form.amount || parseFloat(form.amount) <= 0}
              >
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
