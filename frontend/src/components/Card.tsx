import clsx from 'clsx'

interface CardProps {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export default function Card({ title, description, action, children, className }: CardProps) {
  return (
    <div className={clsx('rounded-xl bg-surface p-6 shadow-card', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-text">{title}</h3>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
