import { useQuery } from '@tanstack/react-query'
import { CreditCard, CheckCircle, ArrowUpRight } from 'lucide-react'

import { orgApi } from '../../../api/tenants.api'
import Button from '../../../components/Button'
import Card from '../../../components/Card'
import Badge from '../../../components/Badge'
import PageHeader from '../../../components/PageHeader'
import LoadingSpinner from '../../../components/LoadingSpinner'

// ── Progress bar ─────────────────────────────────────────────────────

function UsageBar({
  label,
  used,
  limit,
  unit,
}: {
  label: string
  used: number
  limit: number
  unit: string
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const barColor =
    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-teal-500'

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className="text-xs text-muted">
          {used.toLocaleString()} / {limit.toLocaleString()} {unit} ({pct}%)
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Mock invoices ────────────────────────────────────────────────────

const mockInvoices = [
  { id: 'INV-2025-006', date: 'Jun 1, 2025', amount: '$299.00', status: 'Upcoming' },
  { id: 'INV-2025-005', date: 'May 1, 2025', amount: '$299.00', status: 'Paid' },
  { id: 'INV-2025-004', date: 'Apr 1, 2025', amount: '$299.00', status: 'Paid' },
  { id: 'INV-2025-003', date: 'Mar 1, 2025', amount: '$249.00', status: 'Paid' },
]

const planFeatures = [
  'Unlimited retinal image uploads',
  'AI severity grading (standard models)',
  'Email & in-app notifications',
  'Basic analytics dashboard',
  'Referral directory management',
  'Up to 3 sites',
  'Audit log (90-day retention)',
]

// ── Main page ────────────────────────────────────────────────────────

export default function BillingPage() {
  const { data: usage, isLoading } = useQuery({
    queryKey: ['plan-usage'],
    queryFn: orgApi.getPlanUsage,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const plan = usage ?? {
    planName: 'Professional',
    usedCasesThisMonth: 0,
    maxCasesPerMonth: 500,
    usedStorageGb: 0,
    maxStorageGb: 10,
    usedUsers: 0,
    maxUsers: 25,
    percentageUsed: 0,
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Billing & Plan"
        subtitle="Monitor usage, manage your subscription, and view invoices."
        breadcrumbs={[
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Billing & Plan' },
        ]}
      />

      {/* Usage */}
      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">{plan.planName}</h3>
              <p className="text-xs text-muted">Current billing period</p>
            </div>
          </div>
          <Button variant="outline" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
            Upgrade Plan
          </Button>
        </div>
        <div className="space-y-4">
          <UsageBar label="Cases This Month" used={plan.usedCasesThisMonth} limit={plan.maxCasesPerMonth} unit="cases" />
          <UsageBar
            label="Storage"
            used={plan.usedStorageGb}
            limit={plan.maxStorageGb}
            unit="GB"
          />
          <UsageBar label="Active Users" used={plan.usedUsers} limit={plan.maxUsers} unit="users" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plan features */}
        <Card title="Plan Features">
          <ul className="space-y-2.5">
            {planFeatures.map((feat) => (
              <li key={feat} className="flex items-start gap-2 text-sm text-text">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
                {feat}
              </li>
            ))}
          </ul>
        </Card>

        {/* Invoices */}
        <Card title="Invoices">
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted">Invoice</th>
                  <th className="px-3 py-2 text-left font-medium text-muted">Date</th>
                  <th className="px-3 py-2 text-right font-medium text-muted">Amount</th>
                  <th className="px-3 py-2 text-right font-medium text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-medium text-text">{inv.id}</td>
                    <td className="px-3 py-2 text-muted">{inv.date}</td>
                    <td className="px-3 py-2 text-right text-text">{inv.amount}</td>
                    <td className="px-3 py-2 text-right">
                      <Badge
                        variant={inv.status === 'Paid' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
