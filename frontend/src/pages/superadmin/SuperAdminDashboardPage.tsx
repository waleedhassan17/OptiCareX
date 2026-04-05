import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  FolderOpen,
  Cpu,
  AlertTriangle,
  Activity,
} from 'lucide-react'

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

// ── Gauge bar ───────────────────────────────────────────────────────

function GaugeBar({ label, value, max, unit }: { label: string; value: number; max?: number; unit?: string }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-teal-500'
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className="text-xs text-muted">{value}{unit ? ` ${unit}` : ''}{max ? ` / ${max}` : ''}</span>
      </div>
      {max ? (
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      ) : (
        <div className="h-2.5 w-full rounded-full bg-gray-200" />
      )}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────

export default function SuperAdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-summary'],
    queryFn: analyticsApi.getPlatformSummary,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data) return null

  const health = data.systemHealth || {}

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text">Platform Overview</h1>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Organizations"
          value={data.totalOrganizations}
          icon={<Building2 className="h-5 w-5 text-primary" />}
        />
        <KpiCard
          label="Total Cases All Time"
          value={data.totalCases.toLocaleString()}
          icon={<FolderOpen className="h-5 w-5 text-secondary" />}
        />
        <KpiCard
          label="Active Jobs"
          value={data.activeJobs}
          icon={<Cpu className="h-5 w-5 text-teal-500" />}
          accent="text-teal-600"
        />
        <KpiCard
          label="Failed Jobs (24h)"
          value={data.failedJobs}
          icon={<AlertTriangle className="h-5 w-5 text-danger" />}
          accent={data.failedJobs > 0 ? 'text-danger' : 'text-text'}
        />
      </div>

      {/* Orgs table + System Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Organizations">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-muted">Plan</th>
                    <th className="px-3 py-2 text-right font-medium text-muted">Cases/Mo</th>
                    <th className="px-3 py-2 text-right font-medium text-muted">Storage</th>
                    <th className="px-3 py-2 text-right font-medium text-muted">Users</th>
                    <th className="px-3 py-2 text-right font-medium text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(data.organizations || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-muted">
                        No organizations
                      </td>
                    </tr>
                  ) : (
                    (data.organizations as Record<string, unknown>[]).map(
                      (o: Record<string, unknown>) => (
                        <tr key={String(o.id)} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 font-medium text-text">{String(o.name)}</td>
                          <td className="px-3 py-2 text-muted">{String(o.plan)}</td>
                          <td className="px-3 py-2 text-right text-text">{String(o.casesThisMonth)}</td>
                          <td className="px-3 py-2 text-right text-muted">{String(o.storageUsed)}</td>
                          <td className="px-3 py-2 text-right text-text">{String(o.userCount)}</td>
                          <td className="px-3 py-2 text-right">
                            <Badge variant={o.isActive ? 'success' : 'default'} size="sm">
                              {o.isActive ? 'Active' : 'Inactive'}
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

        <div>
          <Card title="System Health">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-500" />
                <span className="text-sm font-medium text-text">Worker Queue</span>
              </div>
              <GaugeBar label="Queue Depth" value={health.queueDepth ?? 0} max={100} unit="jobs" />
              <GaugeBar label="Error Rate (1h)" value={health.errorRatePct ?? 0} max={100} unit="%" />

              <hr className="border-border" />

              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Total Active Users</span>
                <span className="text-lg font-bold text-text">{health.totalUsers ?? 0}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
