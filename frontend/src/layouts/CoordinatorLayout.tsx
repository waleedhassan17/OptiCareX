import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ExternalLink,
  Clock,
  CheckSquare,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { useAuthStore } from '../stores/authStore'

const baseNavItems = [
  { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', href: '/coordinator' },
  { icon: <ExternalLink className="h-5 w-5" />, label: 'Referrals', href: '/coordinator/referrals' },
  { icon: <Clock className="h-5 w-5" />, label: 'Follow-Ups', href: '/coordinator/follow-ups' },
  { icon: <CheckSquare className="h-5 w-5" />, label: 'Tasks', href: '/coordinator/tasks' },
]

export default function CoordinatorLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const { data: badges } = useQuery({
    queryKey: ['coordinator-badges'],
    queryFn: async () => {
      const { analyticsApi } = await import('../api/analytics.api')
      const d = await analyticsApi.getCoordinatorSummary()
      return { referrals: d.openReferrals ?? 0, overdue: d.overdueFollowUps ?? 0 }
    },
    refetchInterval: 60_000,
  })

  const navItems = baseNavItems.map((item) => {
    if (item.label === 'Referrals' && badges?.referrals) return { ...item, badge: badges.referrals }
    if (item.label === 'Follow-Ups' && badges?.overdue) return { ...item, badge: badges.overdue }
    return item
  })

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar navItems={navItems} role="coordinator" />
      <div className="ml-[260px] flex flex-1 flex-col">
        <TopBar
          userName={user?.fullName}
          avatarUrl={user?.avatarUrl}
          onLogout={logout}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
