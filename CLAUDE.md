@AGENTS.md

# Folio — Documentación técnica del proyecto

Tracker personal de portfolio de inversiones. Funciona 100% en el browser: sin backend, sin base de datos, todo persiste en `localStorage`.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.6 — App Router |
| Runtime UI | React 19.2.4 |
| Estilos | Tailwind CSS v4 (`@import "tailwindcss"` + `@theme {}`) |
| Gráficos | Recharts 3.x |
| Componentes base | Radix UI (Dialog, Popover, Select, Label, Slot) |
| Íconos | Lucide React |
| Clases utilitarias | clsx + tailwind-merge |
| API de precios | Finnhub (`NEXT_PUBLIC_FINNHUB_KEY`) |
| Persistencia | `localStorage` — cero backend |
| Lenguaje | TypeScript estricto |

### Configuración de Tailwind (v4)

No hay `tailwind.config.ts`. Los colores de marca se definen en `app/globals.css`:

```css
@import "tailwindcss";
@theme {
  --color-brand:    #378ADD;
  --color-positive: #1D9E75;
  --color-caution:  #EF9F27;
  --color-negative: #E24B4A;
}
```

Dark mode automático vía `prefers-color-scheme` (`:root { color-scheme: light dark }`).

---

## Estructura de archivos

```
folio/
├── app/
│   ├── layout.tsx              # Root layout: Sidebar, BottomNav, AutoSnapshot, AutoEarnings
│   ├── globals.css             # Tailwind v4 + custom theme
│   ├── page.tsx                # Redirige a /dashboard
│   ├── dashboard/page.tsx      # 4 metric cards, pie chart, posiciones, cash, eventos
│   ├── positions/page.tsx      # Tabla CRUD de posiciones con precios en vivo
│   ├── watchlist/page.tsx      # Candidatos con semáforo y barra de distancia
│   ├── companies/page.tsx      # Tarjetas de análisis expandibles (tesis + niveles)
│   ├── evolution/page.tsx      # Gráfico histórico de capital + snapshots manuales
│   ├── calendar/page.tsx       # Vista 2 meses + lista próximos eventos
│   ├── noticias/page.tsx       # Feed de noticias de Finnhub por ticker
│   └── settings/page.tsx       # Export / Import JSON backup
│
├── components/
│   ├── AutoSnapshot.tsx        # Snapshot diario silencioso (layout)
│   ├── AutoEarnings.tsx        # Fetch earnings Finnhub + purge (layout)
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx         # Nav fija desktop + export rápido
│   │   └── BottomNav.tsx       # Nav mobile (bottom)
│   │
│   ├── dashboard/
│   │   ├── MetricCard.tsx
│   │   ├── PortfolioChart.tsx  # PieChart Recharts
│   │   ├── PositionsTable.tsx  # Mini tabla sin columna Estado
│   │   ├── CashPanel.tsx
│   │   └── UpcomingEvents.tsx
│   │
│   ├── positions/
│   │   └── PositionModal.tsx   # Dialog add/edit posición
│   │
│   ├── watchlist/
│   │   └── WatchlistModal.tsx
│   │
│   ├── companies/
│   │   ├── CompanyCard.tsx     # Card expandible con tesis, zonas, notas inline
│   │   └── CompanyDrawer.tsx   # Sheet lateral con formulario completo de análisis
│   │
│   ├── evolution/
│   │   ├── EvolutionChart.tsx  # ComposedChart: Area (portfolio) + Line (aportado)
│   │   ├── SnapshotModal.tsx
│   │   └── HistoryTable.tsx
│   │
│   ├── calendar/
│   │   ├── MonthView.tsx       # Grid mensual lunes-primero con pills de eventos
│   │   └── EventModal.tsx
│   │
│   └── ui/                     # Componentes primitivos reutilizables
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx          # Radix Dialog wrapeado
│       ├── input.tsx
│       ├── label.tsx           # Radix Label
│       ├── popover.tsx         # Radix Popover wrapeado
│       ├── select.tsx          # Radix Select wrapeado
│       ├── sheet.tsx           # Drawer propio (CSS translate, no Radix)
│       └── tabs.tsx            # Tabs propio con count badges
│
├── hooks/
│   └── usePrices.ts            # Batch fetch Finnhub quotes con dedup por tickersKey
│
├── lib/
│   ├── types.ts                # Todas las interfaces TypeScript
│   ├── storage.ts              # Helpers tipados para localStorage
│   ├── calculations.ts         # P&L, peso, totalPortfolioValue, totalInvested
│   └── utils.ts                # cn(), fmtCurrency(), fmtPct(), generateId()
│
├── .env.local                  # NEXT_PUBLIC_FINNHUB_KEY=...
└── dev.sh                      # Script que agrega ~/.local/bin al PATH y corre next dev
```

---

## Modelo de datos (localStorage)

### `portfolio_holdings` → `Holding[]`

```typescript
interface Holding {
  id: string           // generateId()
  ticker: string       // uppercase
  shares: number
  avgPrice: number
  invested: number     // siempre = shares × avgPrice (calculado en handleSave)
  purchaseDate: string | null  // YYYY-MM-DD; null para holdings pre-migración
  notes: string
  addedAt: string      // ISO timestamp de creación
}
```

> `status` fue eliminado del modelo. La decisión mantener/vender vive en Empresas.

---

### `portfolio_cash` → `Cash`

```typescript
interface Cash {
  total: number
  reserve: number
  allocations: CashAllocation[]
}
interface CashAllocation {
  label: string
  ticker: string
  amount: number
}
```

---

### `portfolio_capital_history` → `CapitalHistory[]`

```typescript
interface CapitalHistory {
  date: string          // YYYY-MM-DD
  contributed: number   // capital aportado acumulado
  portfolioValue: number
}
```

Ordenado por fecha ascendente. Alimentado por:
- `AutoSnapshot` (silencioso, una vez por día al cargar la app)
- `SnapshotModal` (manual, desde página Evolución)

---

### `portfolio_events` → `PortfolioEvent[]`

```typescript
interface PortfolioEvent {
  date: string      // YYYY-MM-DD
  ticker: string
  type: 'earnings' | 'review' | 'critical'
  description: string
}
```

**Regla de integridad:** solo existen eventos para tickers que estén en `portfolio_holdings` o `portfolio_watchlist`. `AutoEarnings` purga en cada load los eventos de tickers no trackeados.

---

### `portfolio_watchlist` → `WatchlistItem[]`

```typescript
interface WatchlistItem {
  id: string
  ticker: string
  name: string
  entryZoneLow: number
  entryZoneHigh: number
  cashAllocated: number
  notes: string
}
```

---

### `portfolio_companies` → `Company[]`

```typescript
interface Company {
  id: string
  ticker: string
  name: string
  score: number              // 0-100, slider de convicción
  verdict: string            // 'Comprar' | 'Mantener' | 'Esperar pullback' | 'Observar' | 'No entrar aún'
  semaphore?: string         // 'verde' | 'amarillo' | 'rojo'
  thesis: string             // max 200 chars
  catalysts?: string
  invalidation: string       // texto: qué rompe la tesis
  technicalInvalidation?: number  // precio de invalidación técnica
  entryReasonable: number    // zona razonable low
  entryReasonableHigh?: number
  entryIdeal: number         // zona ideal low
  entryIdealHigh?: number
  noPursueAbove: number
  target: number             // target 12-18 meses
  nextReview: string         // YYYY-MM-DD → crea evento 'review'
  notes: string
  status: string             // 'portfolio' | 'watchlist'
  updatedAt: string
  cashAllocated?: number
  portfolioPct?: number
}
```

---

### `portfolio_monthly_capital` → `number`

Capital mensual de referencia (USD). Default: 800. Usado históricamente por la card de Evolución (card eliminada, clave mantenida por compatibilidad).

---

### `portfolio_earnings_last_check` → `string` (YYYY-MM-DD)

Fecha de la última vez que `AutoEarnings` hizo el fetch a Finnhub. Evita refetch múltiple en el mismo día. No es parte del modelo principal — es estado operacional del componente.

---

## Features implementadas

### Dashboard (`/dashboard`)
- 4 metric cards: Valor total, Capital aportado, P&L total, Liquidez disponible
- PieChart de composición del portfolio (Recharts)
- Tabla resumida de posiciones con precios en vivo
- Panel de cash con desglose de reserva y asignaciones
- Lista "Próximos eventos" (siguiente semana)

### Posiciones (`/positions`)
- Tabla con columnas: Ticker · Invertido · Desde · Acciones · Precio Prom. · Precio Actual · Valor · P&L · P&L% · Peso
- Ordenada automáticamente por `invested` descendente (mayor capital primero)
- Precios en vivo de Finnhub vía `usePrices`
- CRUD completo: add/edit via dialog, delete con confirm
- Columna "Desde": mes abreviado + 2 dígitos de año ("May 26"), "—" si null
- Notes popover por holding: MessageSquare con blue dot indicator cuando tiene nota
- Capital invertido calculado automáticamente (shares × avgPrice), no editable

### Watchlist (`/watchlist`)
- Semáforo de entrada: verde (precio ≤ zona alta), amarillo (≤ zona alta × 1.15), rojo (encima)
- Barra de distancia: 100% en zona, decrece 6.67%/1% sobre zona, 0% a +15%
- Ordenado por semáforo (verde > amarillo > rojo > sin precio)
- CRUD: add/edit via modal, delete limpia sus eventos del calendario

### Empresas (`/companies`)
- Tabs: Todas / Portfolio / Watchlist con contadores
- Cards expandibles: ScoreCircle, ticker+nombre, veredicto badge
- Expandido: tesis (borde azul), info row (score/veredicto/revisión/estado), 4 ZoneBoxes, panel rojo de invalidación técnica, catalizadores, notas inline (blur-to-save)
- `CompanyDrawer`: Sheet lateral de 680px con 7 secciones: Identificación, Score y Veredicto (slider), Tesis, Niveles (zonas con rangos), Sizing, Revisión, Notas
- Al guardar: sincroniza `entryZoneLow/High` en watchlist si el ticker existe, crea evento `review` en calendario
- Delete company limpia sus eventos de revisión

### Evolución (`/evolution`)
- 3 metric cards: Capital aportado, Valor actual, Retorno total (+%)
- ComposedChart: Area rellena (valor portfolio, azul #378ADD) + Line punteada (capital aportado, gris)
- Snapshot manual: abre modal con valores pre-rellenados
- Tabla de historial con delete por snapshot
- `AutoSnapshot`: crea snapshot silencioso una vez por día al cargar

### Calendario (`/calendar`)
- Vista de 2 meses consecutivos (navegable con ‹ ›)
- Grid lunes-primero: `startPad = (firstDay + 6) % 7`
- Pills de eventos coloreados por tipo (azul earnings, naranja review, rojo critical)
- "Hoy" marcado con círculo azul
- Lista "Próximos eventos" debajo del calendario
- CRUD manual de eventos via `EventModal`
- Los eventos de `review` son generados dinámicamente desde `companies.nextReview` (no almacenados directamente en la lista principal)
- Escucha `portfolio_events_changed` custom event para re-renderizar cuando AutoEarnings actualiza

### Noticias (`/noticias`)
- Fetch Finnhub company-news para todos los tickers de portfolio + watchlist
- Últimos 14 días, máx 5 noticias por ticker, máx 60 en total
- Ordenadas por fecha descendente
- Filtro por ticker (pills): Todos + uno por ticker
- Badge de ticker: verde (portfolio) / azul (watchlist)
- Thumbnail: siempre muestra iniciales del ticker en cuadrado de color; solo reemplaza con imagen real si `naturalWidth >= 200 && naturalHeight >= 100` (filtra logos/banners genéricos de Yahoo 354×50)
- Click abre noticia en tab nueva

### Settings (`/settings`)
- Export: descarga JSON con todos los datos (`holdings`, `cash`, `capitalHistory`, `events`, `watchlist`, `companies`, `monthlyCapital`, `exportedAt`)
- Import: carga el JSON, confirm dialog, restaura todos los datos, recarga la página
- Grid de contadores: posiciones, watchlist, empresas, eventos, snapshots

### Sidebar + BottomNav
- Sidebar fija 224px (desktop md+)
- BottomNav mobile (7 items)
- Footer sidebar: "Exportar datos" (quickExport inline) + link a Ajustes
- Nav items: Dashboard · Evolución · Posiciones · Watchlist · Empresas · Noticias · Calendario

---

## Componentes automáticos (montados en layout)

### `AutoSnapshot`

```
Corre en: useEffect (mount único)
Condición: holdings.length > 0 && !snapshot para hoy
Espera: precios cargados (loading === false) antes de guardar
Guarda: { date, contributed (max histórico), portfolioValue }
```

### `AutoEarnings`

```
Corre en: useEffect (mount único)

Step 1 — SIEMPRE (sin API key):
  trackedTickers = Set(holdings.tickers + watchlist.tickers)
  purga events donde ticker ∉ trackedTickers
  → dispara 'portfolio_events_changed' si algo cambió

Step 2 — UNA VEZ POR DÍA (requiere API key):
  si lastCheck === today → return
  fetch earnings Finnhub para cada ticker (from=hoy, to=+90 días)
  para cada ticker con respuesta exitosa:
    elimina TODOS sus eventos 'earnings' existentes
    si tiene próxima fecha → inserta evento nuevo
  → dispara 'portfolio_events_changed'
  → guarda lastCheck = today
```

---

## APIs externas

### Finnhub (`NEXT_PUBLIC_FINNHUB_KEY`)

| Endpoint | Uso | Campo clave |
|----------|-----|-------------|
| `GET /api/v1/quote?symbol=TICKER` | Precio actual de cada holding/watchlist | `data.c` (current price) |
| `GET /api/v1/calendar/earnings?symbol=TICKER&from=DATE&to=DATE` | Próxima fecha de earnings | `earningsCalendar[].date`, `.quarter`, `.year` |
| `GET /api/v1/company-news?symbol=TICKER&from=DATE&to=DATE` | Noticias últimos 14 días | `[].headline`, `.url`, `.image`, `.datetime` (Unix seconds), `.source` |

**Rate limit free tier:** 60 req/min. Con ~10 tickers, el fetch paralelo está bien dentro del límite.

**`usePrices` hook:** deduplica llamadas comparando `tickers.slice().sort().join(',')` contra `prevKey` ref. `refetch()` disponible para actualización manual.

---

## Decisiones de diseño importantes

**Sin backend.** Todo en localStorage. La app es un SPA puro — no hay auth, no hay sync entre dispositivos. El export/import JSON es el mecanismo de backup/migración.

**Tailwind v4.** Sin `tailwind.config.ts`. Colores de marca en `@theme {}` del CSS. Dark mode automático sin clase ni atributo.

**`Sheet` propio.** El drawer lateral no usa Radix. Implementado con `translate-x-0 / translate-x-full` y `overflow-hidden` en `body`. Prop `wide` para 680px (CompanyDrawer) vs 520px.

**`Tabs` propio.** Sin Radix. Activo = fondo blanco con sombra; inactivo = transparente.

**`'use client'` en todas las páginas.** Inevitable porque todo dato viene de localStorage (no accessible en server components).

**Precio fallback.** Si Finnhub no responde, `computeHoldings` usa `avgPrice` en lugar de precio actual. El portfolio siempre muestra algo.

**`AutoEarnings` en layout.** Corre una vez al cargar la app completa (no en cada navegación client-side). Para re-ejecutar el purge en navegación, los `handleDelete` de positions y watchlist lo hacen inline al momento del borrado.

**`portfolio_events_changed` custom event.** Permite que `AutoEarnings` (layout) notifique a `CalendarPage` (child) cuando actualiza storage, sin necesidad de prop drilling ni context.

**`invested` siempre calculado.** `invested = shares × avgPrice` se calcula en `handleSave` del modal, no se acepta como input del usuario. Elimina inconsistencias.

**Columna "Desde" formato compacto.** `"May 26"` — mes abreviado (es-AR) + 2 dígitos de año. Sin día. Null-safe: muestra `"—"` para holdings pre-migración sin `purchaseDate`.

**Earnings purge estricto.** La regla es: si un ticker no está en holdings ni watchlist, ningún evento de ningún tipo debe existir para él. Esto se aplica tanto en `AutoEarnings` (Step 1, cada load) como en `handleDelete` de positions/watchlist.

---

## Bugs conocidos / cosas pendientes

- **`purchaseDate` null en holdings existentes.** Holdings creados antes de la migración tienen `purchaseDate: null`. Muestran "—" en la tabla. Se normaliza al editar el holding.

- **Calendar no actualiza en navegación client-side.** `AutoEarnings` usa `useEffect(fn, [])` y corre solo en mount del layout. Si el usuario agrega un holding y navega al calendario sin recargar la app, el purge de ese ticker no corre hasta el próximo full reload. Los `handleDelete` mitigan esto para el caso de borrado.

- **Thumbnail heurística (200×100).** La imagen de noticia se muestra solo si `naturalWidth >= 200 && naturalHeight >= 100` para filtrar el logo de Yahoo Finance (354×50px). Esto podría descartar imágenes reales pequeñas de algunas fuentes.

- **Watchlist sync unidireccional.** Cuando se guarda una Company con zonas de entrada, se actualizan `entryZoneLow/High` en el item correspondiente de watchlist. No hay sincronización en sentido inverso.

- **No hay validación de ticker.** El app acepta cualquier string como ticker. Si Finnhub no reconoce el símbolo, el precio queda en 0 (fallback a avgPrice) y las noticias/earnings devuelven vacío, sin error visible al usuario.

- **`localStorage` ~5MB en la mayoría de browsers.** Con snapshots diarios por muchos años y muchas noticias no cacheadas, podría acercarse al límite. Las noticias no se persisten (se fetchean en vivo) así que el riesgo real es solo el capital history.

- **Earnings: solo toma el próximo evento.** Si Finnhub devuelve múltiples fechas de earnings en los próximos 90 días (Q1 + Q2), solo se guarda la primera. Suficiente para el caso de uso actual.
