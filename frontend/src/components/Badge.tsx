import clsx from 'clsx'

const variantStyles = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100/60 text-green-800',
  warning: 'bg-amber-100/60 text-amber-800',
  danger: 'bg-red-100/60 text-red-800',
  info: 'bg-blue-100/60 text-blue-800',
  purple: 'bg-purple-100/60 text-purple-800',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

interface BadgeProps {
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
  children: React.ReactNode
  className?: string
}

export default function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}
