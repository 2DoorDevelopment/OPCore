import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-dim',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
