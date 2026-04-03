import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'

interface SearchBarProps {
  placeholder?: string
  onSearch: (value: string) => void
  className?: string
}

export default function SearchBar({ placeholder = 'Search…', onSearch, className }: SearchBarProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value)
    }, 300)
    return () => clearTimeout(timer)
  }, [value, onSearch])

  const handleClear = useCallback(() => {
    setValue('')
  }, [])

  return (
    <div className={clsx('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-8 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
