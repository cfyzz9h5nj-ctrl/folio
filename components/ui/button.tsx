import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50',
          size === 'sm' && 'h-8 px-3 text-sm',
          size === 'md' && 'h-9 px-4 text-sm',
          size === 'lg' && 'h-10 px-6 text-base',
          variant === 'primary' &&
            'bg-[#378ADD] text-white hover:bg-[#2d6fb8]',
          variant === 'secondary' &&
            'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
          variant === 'ghost' &&
            'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
          variant === 'destructive' &&
            'bg-[#E24B4A] text-white hover:bg-red-700',
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
