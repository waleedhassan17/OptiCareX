import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  FolderOpen,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { useAuthStore } from '../stores/authStore'

const baseNavItems = [
  { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', href: '/clinician' },
  { icon: <ClipboardList className="h-5 w-5" />, label: 'Review Queue', href: '/clinician/queue' },
  { icon: <FolderOpen className="h-5 w-5" />, label: 'All Cases', href: '/clinician/cases' },
]

export default function ClinicianLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const { data: badge } = useQuery({
    queryKey: ['clinician-queue-badge'],
    queryFn: async () => {
      const { analyticsApi } = await import('../api/analytics.api')
      const d = await analyticsApi.getClinicianSummary()
      return d.inQueue ?? 0
    },
    refetchInterval: 60_000,
  })

  const navItems = baseNavItems.map((item) =>
    item.label === 'Review Queue' && badge ? { ...item, badge } : item,
  )

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar navItems={navItems} role="clinician" />
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
