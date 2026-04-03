import type { TextareaHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import clsx from 'clsx'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, name, error, rows = 4, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={name}
          name={name}
          rows={rows}
          className={clsx(
            'w-full rounded-md border bg-surface px-3 py-2 text-sm text-text transition-colors placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30',
            error ? 'border-danger text-danger' : 'border-border',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
