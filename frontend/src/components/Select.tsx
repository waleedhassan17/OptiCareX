import type { SelectHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import clsx from 'clsx'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, name, options, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-text">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={name}
          name={name}
          className={clsx(
            'h-11 w-full rounded-md border bg-surface px-3 text-sm text-text transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30',
            error ? 'border-danger text-danger' : 'border-border',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
