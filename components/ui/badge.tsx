import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'positive' | 'negative' | 'caution' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        variant === 'positive' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
        variant === 'negative' && 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
        variant === 'caution' && 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
        variant === 'outline' && 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
        className,
      )}
      {...props}
    />
  )
}
