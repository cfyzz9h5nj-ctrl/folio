'use client'

import { useRef, useState } from 'react'
import { Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { storage } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function exportData() {
  const data = {
    holdings: storage.getHoldings(),
    cash: storage.getCash(),
    capitalHistory: storage.getCapitalHistory(),
    contributions: storage.getContributions(),
    seguimiento: storage.getSeguimiento(),
    // legacy keys kept for backward compat
    watchlist: storage.getWatchlist(),
    companies: storage.getCompanies(),
    monthlyCapital: storage.getMonthlyCapital(),
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `folio-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!confirm('¿Reemplazar TODOS tus datos actuales con este backup? Esta acción no se puede deshacer.')) {
          e.target.value = ''
          return
        }
        if (data.holdings !== undefined) storage.setHoldings(data.holdings)
        if (data.cash !== undefined) storage.setCash(data.cash)
        if (data.capitalHistory !== undefined) storage.setCapitalHistory(data.capitalHistory)
        if (data.contributions !== undefined) storage.setContributions(data.contributions)
        if (data.seguimiento !== undefined) storage.setSeguimiento(data.seguimiento)
        if (data.watchlist !== undefined) storage.setWatchlist(data.watchlist)
        if (data.companies !== undefined) storage.setCompanies(data.companies)
        if (data.monthlyCapital !== undefined) storage.setMonthlyCapital(data.monthlyCapital)
        setStatus('success')
        setMsg(`Backup del ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString('es') : 'archivo'} importado correctamente.`)
        setTimeout(() => window.location.reload(), 1500)
      } catch {
        setStatus('error')
        setMsg('El archivo no es un backup válido de Folio.')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Ajustes</h1>
        <p className="mt-0.5 text-sm text-slate-500">Backup y restauración de datos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle>Exportar datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">
              Descargá un archivo <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">.json</code> con
              todos tus datos: posiciones, seguimiento, historial y cash.
              Usalo para migrar de browser o dispositivo.
            </p>
            <Button onClick={exportData}>
              <Download size={14} />
              Descargar backup
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle>Importar datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">
              Restaurá desde un backup exportado previamente. <strong className="text-slate-700 dark:text-slate-300">Reemplaza todos los datos actuales.</strong>
            </p>
            {status === 'success' && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 size={14} />
                {msg}
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-[#E24B4A] dark:bg-red-950/30">
                <AlertCircle size={14} />
                {msg}
              </div>
            )}
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={14} />
              Seleccionar archivo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </CardContent>
        </Card>
      </div>

      {/* Data summary */}
      <Card>
        <CardHeader><CardTitle>Datos almacenados</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            {[
              { label: 'Posiciones', count: storage.getHoldings().length },
              { label: 'Seguimiento', count: storage.getSeguimiento().length },
              { label: 'Snapshots', count: storage.getCapitalHistory().length },
            ].map(({ label, count }) => (
              <div key={label} className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/40">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-slate-800 dark:text-slate-200">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
