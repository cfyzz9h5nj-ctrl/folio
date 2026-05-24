import { cn } from '@/lib/utils'

interface Tab {
  value: string
  label: string
  count?: number
}

interface TabsProps {
  value: string
  onChange: (v: string) => void
  tabs: Tab[]
}

export function Tabs({ value, onChange, tabs }: TabsProps) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100/60 p-0.5 dark:border-slate-700 dark:bg-slate-800/60">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all',
            value === tab.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                value === tab.value
                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                  : 'bg-slate-200/60 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
