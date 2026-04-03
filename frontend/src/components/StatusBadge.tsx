import Badge from './Badge'
import type { CaseStatus } from '../types'

const statusConfig: Record<CaseStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'; pulse?: boolean }> = {
  draft: { label: 'Draft', variant: 'default' },
  submitted: { label: 'Submitted', variant: 'info' },
  inference_running: { label: 'Inference Running', variant: 'purple', pulse: true },
  inference_complete: { label: 'Inference Complete', variant: 'success' },
  needs_review: { label: 'Needs Review', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  referral_created: { label: 'Referral Created', variant: 'info' },
  followup_scheduled: { label: 'Follow-Up Scheduled', variant: 'info' },
  closed: { label: 'Closed', variant: 'default' },
}

interface StatusBadgeProps {
  status: CaseStatus
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: 'default' as const }

  return (
    <span className={config.pulse ? 'animate-pulse' : undefined}>
      <Badge variant={config.variant} className={className}>
        {config.label}
      </Badge>
    </span>
  )
}
