import { useQuery } from '@tanstack/react-query'
import {
  FolderOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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
  change,
  accent = 'text-primary',
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  change?: number
  accent?: string
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
          {change !== undefined && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              {change >= 0 ? (
                <TrendingUp className="h-3 w-3 text-teal-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-danger" />
              )}
              <span className={change >= 0 ? 'text-teal-600' : 'text-danger'}>
                {change > 0 ? '+' : ''}
                {change}% vs last month
              </span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
      </div>
    </Card>
  )
}

// ── Colors ──────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: '#94A3B8',
  submitted: '#3B82F6',
  inference_running: '#8B5CF6',
  inference_complete: '#6366F1',
  needs_review: '#F59E0B',
  confirmed: '#10B981',
  referral_created: '#F97316',
  followup_scheduled: '#06B6D4',
  closed: '#64748B',
}

// ── Main page ───────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: analyticsApi.getAdminSummary,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data) return null

  const donutData = Object.entries(data.casesByStatus || {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value: value as number,
  }))

  const alerts = data.alerts || {}

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Dashboard</h1>

      {/* Row 1: KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Cases This Month"
          value={data.casesThisMonth}
          icon={<FolderOpen className="h-5 w-5 text-primary" />}
          change={data.pctChange}
        />
        <KpiCard
          label="Confirmed Cases"
          value={data.confirmed}
          icon={<CheckCircle2 className="h-5 w-5 text-teal-500" />}
          accent="text-teal-600"
        />
        <KpiCard
          label="Pending Review"
          value={data.pendingReview}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          accent={data.pendingReview > 0 ? 'text-amber-600' : 'text-text'}
        />
        <KpiCard
          label="Open Referrals"
          value={data.openReferrals}
          icon={<ExternalLink className="h-5 w-5 text-secondary" />}
        />
      </div>

      {/* Row 2: Donut + Activity feed */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Cases by Status">
          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
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
                      fill={STATUS_COLORS[entry.name.replace(/ /g, '_')] || '#94A3B8'}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted">No case data yet</p>
          )}
        </Card>

        <Card title="Recent Activity">
          <div className="max-h-[260px] overflow-y-auto">
            {(data.recentActivity || []).length === 0 ? (
              <p className="py-12 text-center text-sm text-muted">No recent activity</p>
            ) : (
              <ul className="divide-y divide-border">
                {(data.recentActivity as Record<string, unknown>[]).map(
                  (ev: Record<string, unknown>, i: number) => (
                    <li key={i} className="flex items-start gap-3 py-2.5">
                      <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-text">
                          <span className="font-medium">{String(ev.actor__fullName || 'System')}</span>{' '}
                          {String(ev.action)} on {String(ev.resourceType)}
                        </p>
                        <p className="text-xs text-muted">
                          {ev.createdAt
                            ? format(new Date(String(ev.createdAt)), 'MMM d, h:mm a')
                            : ''}
                        </p>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Row 3: Trend + Top Technicians */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Cases Trend (30 Days)">
          {(data.trend || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => format(new Date(v), 'M/d')}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={(v) => format(new Date(String(v)), 'MMM d, yyyy')} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="submitted"
                  stroke="#1565C0"
                  strokeWidth={2}
                  dot={false}
                  name="Submitted"
                />
                <Line
                  type="monotone"
                  dataKey="confirmed"
                  stroke="#00897B"
                  strokeWidth={2}
                  dot={false}
                  name="Confirmed"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted">No trend data</p>
          )}
        </Card>

        <Card title="Top Technicians">
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted">Name</th>
                  <th className="px-3 py-2 text-right font-medium text-muted">Cases</th>
                  <th className="px-3 py-2 text-right font-medium text-muted">Avg Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data.topTechnicians || []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-muted">
                      No technician data
                    </td>
                  </tr>
                ) : (
                  (data.topTechnicians as Record<string, unknown>[]).map(
                    (t: Record<string, unknown>, i: number) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-medium text-text">{String(t.fullName)}</td>
                        <td className="px-3 py-2 text-right text-text">{String(t.casesSubmitted)}</td>
                        <td className="px-3 py-2 text-right">
                          <Badge
                            variant={
                              Number(t.avgQuality) >= 0.8
                                ? 'success'
                                : Number(t.avgQuality) >= 0.5
                                  ? 'warning'
                                  : 'danger'
                            }
                            size="sm"
                          >
                            {t.avgQuality != null ? `${(Number(t.avgQuality) * 100).toFixed(0)}%` : '—'}
                          </Badge>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {(alerts.overdueReferrals > 0 || alerts.stuckInference > 0 || alerts.ungradableRate > 15) && (
        <Card title="Alerts">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {alerts.overdueReferrals > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-medium text-danger">Overdue Referrals</p>
                  <p className="text-xs text-red-700">{alerts.overdueReferrals} referrals older than 7 days</p>
                </div>
              </div>
            )}
            {alerts.stuckInference > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-medium text-danger">Stuck Inference</p>
                  <p className="text-xs text-red-700">{alerts.stuckInference} cases running &gt;1 hr</p>
                </div>
              </div>
            )}
            {alerts.ungradableRate > 15 && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-medium text-danger">High Ungradable Rate</p>
                  <p className="text-xs text-red-700">{alerts.ungradableRate}% this month</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
