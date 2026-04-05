import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Timer,
  ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { format } from 'date-fns'

import { analyticsApi } from '../../api/analytics.api'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import LoadingSpinner from '../../components/LoadingSpinner'

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

const PIE_COLORS = ['#0D3B66', '#1565C0', '#00897B', '#F59E0B', '#E65100', '#8B5CF6', '#EC4899', '#64748B']

// ── Main page ───────────────────────────────────────────────────────

export default function ClinicianDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['clinician-summary'],
    queryFn: analyticsApi.getClinicianSummary,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data) return null

  const outcomesData = Object.entries(data.outcomesDistribution || {}).map(([name, value]) => ({
    name,
    value: value as number,
  }))

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Dashboard</h1>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="In My Queue"
          value={data.inQueue}
          icon={<ClipboardList className="h-5 w-5 text-primary" />}
        />
        <KpiCard
          label="Urgent Cases"
          value={data.urgentCases}
          icon={<AlertTriangle className="h-5 w-5 text-danger" />}
          accent={data.urgentCases > 0 ? 'text-danger' : 'text-text'}
        />
        <KpiCard
          label="Confirmed Today"
          value={data.confirmedToday}
          icon={<CheckCircle2 className="h-5 w-5 text-teal-500" />}
          accent="text-teal-600"
        />
        <KpiCard
          label="Avg Review Time"
          value={data.avgReviewTimeMins != null ? `${data.avgReviewTimeMins} min` : '—'}
          icon={<Timer className="h-5 w-5 text-secondary" />}
        />
      </div>

      {/* Jump to Queue + Queue Preview */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Link to="/clinician/queue">
            <Button fullWidth leftIcon={<ArrowRight className="h-4 w-4" />}>
              Jump to Review Queue
            </Button>
          </Link>

          <Card title="Outcomes This Week">
            {outcomesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={outcomesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={(props: PieLabelRenderProps) =>
                      `${String(props.name ?? '')} ${(((props.percent ?? 0)) * 100).toFixed(0)}%`
                    }
                  >
                    {outcomesData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted">No reviews this week</p>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Queue Preview (Top 5 by Urgency)">
            {(data.queuePreview || []).length === 0 ? (
              <p className="py-12 text-center text-sm text-muted">Queue is empty</p>
            ) : (
              <div className="divide-y divide-border">
                {(data.queuePreview as Record<string, unknown>[]).map(
                  (c: Record<string, unknown>) => (
                    <div key={String(c.id)} className="flex items-center justify-between py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-text">
                            {String(c.patientExternalId || String(c.id).slice(0, 8))}
                          </p>
                          {Boolean(c.isUrgent) && <Badge variant="danger" size="sm">Urgent</Badge>}
                        </div>
                        <p className="text-xs text-muted">
                          {c.createdAt
                            ? format(new Date(String(c.createdAt)), 'MMM d, h:mm a')
                            : ''}
                        </p>
                      </div>
                      <Link
                        to={`/clinician/queue/${c.id}`}
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Review <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ),
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
