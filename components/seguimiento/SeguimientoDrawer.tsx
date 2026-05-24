'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { generateId } from '@/lib/utils'
import type { SeguimientoItem } from '@/lib/types'

/* ─── options ─────────────────────────────────── */
const VERDICT_OPTS = [
  { value: 'Comprar', label: 'Comprar' },
  { value: 'Mantener', label: 'Mantener' },
  { value: 'Esperar pullback', label: 'Esperar pullback' },
  { value: 'Observar', label: 'Observar' },
  { value: 'No entrar aún', label: 'No entrar aún' },
]
const STATUS_OPTS = [
  { value: 'watchlist', label: 'Watchlist' },
  { value: 'portfolio', label: 'Portfolio' },
]

/* ─── form state ──────────────────────────────── */
interface FormState {
  ticker: string
  status: string
  score: number
  verdict: string
  thesis: string
  catalysts: string
  invalidation: string
  entryZoneLow: number
  entryZoneHigh: number
  entryIdealLow: number
  entryIdealHigh: number
  noPursueAbove: number
  technicalInvalidation: number
  target: number
  cashAllocated: number
  portfolioPct: number
  nextReview: string
  notes: string
  image: string | undefined
}

const empty = (): FormState => ({
  ticker: '',
  status: 'watchlist',
  score: 70,
  verdict: 'Observar',
  thesis: '',
  catalysts: '',
  invalidation: '',
  entryZoneLow: 0,
  entryZoneHigh: 0,
  entryIdealLow: 0,
  entryIdealHigh: 0,
  noPursueAbove: 0,
  technicalInvalidation: 0,
  target: 0,
  cashAllocated: 0,
  portfolioPct: 0,
  nextReview: '',
  notes: '',
  image: undefined,
})

/* ─── helpers ─────────────────────────────────── */
function scoreColor(s: number) {
  if (s >= 80) return '#1D9E75'
  if (s >= 65) return '#EF9F27'
  return '#E24B4A'
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 mt-6 flex items-center gap-2 first:mt-0">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {children}
      </span>
      <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

/* ─── props ───────────────────────────────────── */
interface Props {
  open: boolean
  onClose: () => void
  item?: SeguimientoItem | null
  onSave: (item: SeguimientoItem) => void
}

/* ─── component ───────────────────────────────── */
export function SeguimientoDrawer({ open, onClose, item, onSave }: Props) {
  const [form, setForm] = useState<FormState>(empty())
  const imgInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (item) {
        setForm({
          ticker: item.ticker,
          status: item.status,
          score: item.score,
          verdict: item.verdict,
          thesis: item.thesis,
          catalysts: item.catalysts ?? '',
          invalidation: item.invalidation,
          entryZoneLow: item.entryZoneLow,
          entryZoneHigh: item.entryZoneHigh,
          entryIdealLow: item.entryIdealLow,
          entryIdealHigh: item.entryIdealHigh,
          noPursueAbove: item.noPursueAbove,
          technicalInvalidation: item.technicalInvalidation ?? 0,
          target: item.target,
          cashAllocated: item.cashAllocated,
          portfolioPct: item.portfolioPct ?? 0,
          nextReview: item.nextReview,
          notes: item.notes,
          image: item.image,
        })
      } else {
        setForm(empty())
      }
    }
  }, [open, item])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('image', ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSave = () => {
    if (!form.ticker.trim()) return
    const saved: SeguimientoItem = {
      id: item?.id ?? generateId(),
      ticker: form.ticker.toUpperCase().trim(),
      name: item?.name ?? '',   // preserve existing name, empty for new
      score: form.score,
      verdict: form.verdict,
      thesis: form.thesis,
      catalysts: form.catalysts || undefined,
      invalidation: form.invalidation,
      entryZoneLow: Number(form.entryZoneLow),
      entryZoneHigh: Number(form.entryZoneHigh),
      entryIdealLow: Number(form.entryIdealLow),
      entryIdealHigh: Number(form.entryIdealHigh),
      noPursueAbove: Number(form.noPursueAbove),
      technicalInvalidation: Number(form.technicalInvalidation) || undefined,
      target: Number(form.target),
      cashAllocated: Number(form.cashAllocated),
      portfolioPct: Number(form.portfolioPct) || undefined,
      status: form.status,
      nextReview: form.nextReview,
      notes: form.notes,
      updatedAt: new Date().toISOString(),
      image: form.image,
    }
    onSave(saved)
    onClose()
  }

  const scoreCol = scoreColor(form.score)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={item ? `Editar — ${item.ticker}` : 'Nueva empresa'}
      description="Documentá tu análisis, niveles e imagen del dashboard."
      wide
    >
      {/* ── Identificación ─────────────────────── */}
      <SectionHead>Identificación</SectionHead>
      <Row>
        <Field label="Ticker">
          <Input
            placeholder="AAPL"
            value={form.ticker}
            onChange={(e) => set('ticker', e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Estado">
          <Select
            options={STATUS_OPTS}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          />
        </Field>
      </Row>

      {/* ── Imagen del dashboard ───────────────── */}
      <SectionHead>Imagen del dashboard</SectionHead>
      {form.image ? (
        <div className="group relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <img
            src={form.image}
            alt="Dashboard preview"
            className="max-h-52 w-full object-contain"
          />
          <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => imgInputRef.current?.click()}
              className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white dark:bg-slate-800/90 dark:text-slate-200"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={() => set('image', undefined)}
              className="rounded-md bg-white/90 p-1 text-slate-500 shadow hover:bg-white hover:text-[#E24B4A] dark:bg-slate-800/90"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => imgInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 py-5 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 dark:border-slate-700 dark:hover:border-slate-600"
        >
          <ImagePlus size={15} />
          Subir imagen (JPG / PNG)
        </button>
      )}
      <input
        ref={imgInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* ── Score y Veredicto ──────────────────── */}
      <SectionHead>Score y Veredicto</SectionHead>
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Score de convicción</Label>
            <span className="text-xl font-bold tabular-nums" style={{ color: scoreCol }}>
              {form.score}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={form.score}
            onChange={(e) => set('score', Number(e.target.value))}
            className="w-full cursor-pointer"
            style={{ accentColor: scoreCol }}
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>0 — No entrar</span>
            <span>65 — Interesante</span>
            <span>80+ — Alta convicción</span>
          </div>
        </div>
        <Field label="Veredicto">
          <Select
            options={VERDICT_OPTS}
            value={form.verdict}
            onChange={(e) => set('verdict', e.target.value)}
          />
        </Field>
      </div>

      {/* ── Tesis ─────────────────────────────── */}
      <SectionHead>Tesis</SectionHead>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Tesis en una frase</Label>
            <span className="text-xs text-slate-400">{form.thesis.length}/200</span>
          </div>
          <textarea
            rows={2}
            maxLength={200}
            placeholder="¿Por qué vale la pena seguir esta empresa?"
            className="flex w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={form.thesis}
            onChange={(e) => set('thesis', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Catalizadores clave</Label>
          <textarea
            rows={2}
            placeholder="Eventos o hechos que acelerarían el caso de inversión…"
            className="flex w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={form.catalysts}
            onChange={(e) => set('catalysts', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Qué rompe la tesis / Invalidación fundamental</Label>
          <textarea
            rows={2}
            placeholder="Condición que haría vender o no entrar…"
            className="flex w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={form.invalidation}
            onChange={(e) => set('invalidation', e.target.value)}
          />
        </div>
      </div>

      {/* ── Niveles ───────────────────────────── */}
      <SectionHead>Niveles de entrada</SectionHead>
      <div className="space-y-3">
        <Row>
          <Field label="Zona entrada — desde (USD)">
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={form.entryZoneLow || ''}
              onChange={(e) => set('entryZoneLow', Number(e.target.value))}
            />
          </Field>
          <Field label="Zona entrada — hasta (USD)">
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={form.entryZoneHigh || ''}
              onChange={(e) => set('entryZoneHigh', Number(e.target.value))}
            />
          </Field>
        </Row>
        <Row>
          <Field label="Zona ideal — desde (USD)">
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={form.entryIdealLow || ''}
              onChange={(e) => set('entryIdealLow', Number(e.target.value))}
            />
          </Field>
          <Field label="Zona ideal — hasta (USD)">
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={form.entryIdealHigh || ''}
              onChange={(e) => set('entryIdealHigh', Number(e.target.value))}
            />
          </Field>
        </Row>
        <Row>
          <Field label="No perseguir sobre (USD)">
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={form.noPursueAbove || ''}
              onChange={(e) => set('noPursueAbove', Number(e.target.value))}
            />
          </Field>
          <Field label="Invalidación técnica bajo (USD)">
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={form.technicalInvalidation || ''}
              onChange={(e) => set('technicalInvalidation', Number(e.target.value))}
            />
          </Field>
        </Row>
        <Field label="Target 12-18 meses (USD)">
          <Input
            type="number"
            step="any"
            placeholder="0.00"
            value={form.target || ''}
            onChange={(e) => set('target', Number(e.target.value))}
          />
        </Field>
      </div>

      {/* ── Sizing ────────────────────────────── */}
      <SectionHead>Sizing</SectionHead>
      <Row>
        <Field label="Cash asignado (USD)">
          <Input
            type="number"
            step="any"
            placeholder="0"
            value={form.cashAllocated || ''}
            onChange={(e) => set('cashAllocated', Number(e.target.value))}
          />
        </Field>
        <Field label="% cartera objetivo">
          <Input
            type="number"
            step="any"
            placeholder="5"
            value={form.portfolioPct || ''}
            onChange={(e) => set('portfolioPct', Number(e.target.value))}
          />
        </Field>
      </Row>

      {/* ── Revisión ──────────────────────────── */}
      <SectionHead>Revisión</SectionHead>
      <Field label="Próxima revisión">
        <Input
          type="date"
          value={form.nextReview}
          onChange={(e) => set('nextReview', e.target.value)}
        />
      </Field>

      {/* ── Notas ─────────────────────────────── */}
      <SectionHead>Notas del inversor</SectionHead>
      <textarea
        rows={6}
        placeholder="Notas libres, resumen del análisis, ideas…"
        className="flex w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        value={form.notes}
        onChange={(e) => set('notes', e.target.value)}
      />

      {/* ── Actions ───────────────────────────── */}
      <div className="mt-8 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={!form.ticker.trim()}>
          {item ? 'Guardar cambios' : 'Crear empresa'}
        </Button>
      </div>
    </Sheet>
  )
}
