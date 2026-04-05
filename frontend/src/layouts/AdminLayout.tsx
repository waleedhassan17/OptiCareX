import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { useAuthStore } from '../stores/authStore'
import { orgApi } from '../api/tenants.api'

const navItems = [
  { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', href: '/admin' },
  { icon: <FolderOpen className="h-5 w-5" />, label: 'Cases', href: '/admin/cases' },
  { icon: <Users className="h-5 w-5" />, label: 'Users', href: '/admin/users' },
  { icon: <Settings className="h-5 w-5" />, label: 'Settings', href: '/admin/settings' },
]

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const { data: orgSettings } = useQuery({
    queryKey: ['org-settings'],
    queryFn: orgApi.getSettings,
  })

  // Inject live badge for open-cases count
  const { data: casesBadge } = useQuery({
    queryKey: ['admin-cases-badge'],
    queryFn: async () => {
      const { analyticsApi } = await import('../api/analytics.api')
      const d = await analyticsApi.getAdminSummary()
      return d.pendingReview ?? 0
    },
    refetchInterval: 60_000,
  })

  const items = navItems.map((item) =>
    item.label === 'Cases' && casesBadge ? { ...item, badge: casesBadge } : item,
  )

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar navItems={items} role="orgadmin" />
      <div className="ml-[260px] flex flex-1 flex-col">
        <TopBar
          breadcrumb={orgSettings?.name}
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
