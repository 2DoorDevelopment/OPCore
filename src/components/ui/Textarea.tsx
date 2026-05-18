import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-dim',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors resize-none',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
