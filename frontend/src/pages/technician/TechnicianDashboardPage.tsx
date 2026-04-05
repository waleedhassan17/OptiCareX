import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FolderOpen,
  Clock,
  Star,
  Cpu,
  ArrowRight,
  PlusCircle,
  Upload,
} from 'lucide-react'

import { analyticsApi } from '../../api/analytics.api'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import LoadingSpinner from '../../components/LoadingSpinner'
import { format } from 'date-fns'

// ── KPI Card ────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  accent = 'text-primary',
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  accent?: string
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
      </div>
    </Card>
  )
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  draft: { label: 'Draft', variant: 'default' },
  submitted: { label: 'Submitted', variant: 'info' },
  inference_running: { label: 'AI Running', variant: 'purple' },
  inference_complete: { label: 'AI Done', variant: 'info' },
  needs_review: { label: 'Needs Review', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  referral_created: { label: 'Referred', variant: 'warning' },
  followup_scheduled: { label: 'Follow-up', variant: 'info' },
  closed: { label: 'Closed', variant: 'default' },
}

// ── Main page ───────────────────────────────────────────────────────

export default function TechnicianDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['technician-summary'],
    queryFn: analyticsApi.getTechnicianSummary,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data) return null

  const qualityColor =
    data.avgQualityScore == null
      ? 'text-muted'
      : data.avgQualityScore >= 0.8
        ? 'text-teal-600'
        : data.avgQualityScore >= 0.5
          ? 'text-amber-600'
          : 'text-danger'

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Dashboard</h1>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="My Cases Today"
          value={data.myCasesToday}
          icon={<FolderOpen className="h-5 w-5 text-primary" />}
        />
        <KpiCard
          label="Pending Submission"
          value={data.pendingSubmission}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          accent={data.pendingSubmission > 0 ? 'text-amber-600' : 'text-text'}
        />
        <KpiCard
          label="Avg Quality Score"
          value={data.avgQualityScore != null ? `${(data.avgQualityScore * 100).toFixed(0)}%` : '—'}
          icon={<Star className="h-5 w-5 text-amber-500" />}
          accent={qualityColor}
        />
        <KpiCard
          label="Batch Jobs Active"
          value={data.batchJobsActive}
          icon={<Cpu className="h-5 w-5 text-secondary" />}
        />
      </div>

      {/* Quick Actions + Recent Cases */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="space-y-4">
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Link to="/technician/new-case">
                <Button fullWidth leftIcon={<PlusCircle className="h-4 w-4" />}>
                  Create New Case
                </Button>
              </Link>
              <Link to="/technician/batch">
                <Button variant="outline" fullWidth leftIcon={<Upload className="h-4 w-4" />}>
                  Upload Batch
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Cases */}
        <div className="lg:col-span-2">
          <Card title="My Recent Cases">
            {(data.recentCases || []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No cases yet</p>
            ) : (
              <div className="divide-y divide-border">
                {(data.recentCases as Record<string, unknown>[]).map(
                  (c: Record<string, unknown>) => {
                    const st = STATUS_MAP[String(c.status)] || { label: String(c.status), variant: 'default' as const }
                    return (
                      <div
                        key={String(c.id)}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-text">
                              {String(c.patientExternalId || String(c.id).slice(0, 8))}
                            </p>
                            {Boolean(c.isUrgent) && (
                              <Badge variant="danger" size="sm">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted">
                            {c.encounterDate
                              ? format(new Date(String(c.encounterDate)), 'MMM d, yyyy')
                              : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={st.variant} size="sm">{st.label}</Badge>
                          {c.status === 'draft' && (
                            <Link
                              to={`/technician/cases/${c.id}`}
                              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              Continue <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
