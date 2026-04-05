import { useQuery } from '@tanstack/react-query'
import {
  ExternalLink,
  AlertTriangle,
  CheckSquare,
  CalendarCheck2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'
import { format } from 'date-fns'

import { analyticsApi } from '../../api/analytics.api'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
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

const REFERRAL_COLORS: Record<string, string> = {
  created: '#3B82F6',
  sent: '#8B5CF6',
  acknowledged: '#06B6D4',
  scheduled: '#10B981',
  completed: '#64748B',
  closed: '#94A3B8',
  failed: '#EF4444',
}

// ── Main page ───────────────────────────────────────────────────────

export default function CoordinatorDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['coordinator-summary'],
    queryFn: analyticsApi.getCoordinatorSummary,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data) return null

  const donutData = Object.entries(data.referralsByStatus || {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value: value as number,
  }))

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Dashboard</h1>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Open Referrals"
          value={data.openReferrals}
          icon={<ExternalLink className="h-5 w-5 text-primary" />}
        />
        <KpiCard
          label="Overdue Follow-Ups"
          value={data.overdueFollowUps}
          icon={<AlertTriangle className="h-5 w-5 text-danger" />}
          accent={data.overdueFollowUps > 0 ? 'text-danger' : 'text-text'}
        />
        <KpiCard
          label="Tasks Due Today"
          value={data.tasksDueToday}
          icon={<CheckSquare className="h-5 w-5 text-amber-500" />}
        />
        <KpiCard
          label="Completed This Week"
          value={data.completedThisWeek}
          icon={<CalendarCheck2 className="h-5 w-5 text-teal-500" />}
          accent="text-teal-600"
        />
      </div>

      {/* Overdue + referrals chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Overdue Follow-Ups">
          {(data.overdueFollowUpList || []).length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No overdue follow-ups</p>
          ) : (
            <div className="max-h-[320px] divide-y divide-border overflow-y-auto">
              {(data.overdueFollowUpList as Record<string, unknown>[]).map(
                (f: Record<string, unknown>) => (
                  <div key={String(f.id)} className="flex items-start gap-3 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text">
                        Case {String(f.case__id || f.caseId || '').slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted">
                        Due {f.dueDate ? format(new Date(String(f.dueDate)), 'MMM d, yyyy') : '—'}
                      </p>
                      {Boolean(f.instructions) && (
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {String(f.instructions)}
                        </p>
                      )}
                    </div>
                    <Badge variant="danger" size="sm">Overdue</Badge>
                  </div>
                ),
              )}
            </div>
          )}
        </Card>

        <Card title="Referrals by Status">
          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {donutData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={REFERRAL_COLORS[entry.name.replace(/ /g, '_')] || '#94A3B8'}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted">No referral data</p>
          )}
        </Card>
      </div>
    </div>
  )
}
