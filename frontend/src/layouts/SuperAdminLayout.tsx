import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Activity,
  FileText,
} from 'lucide-react'

import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { useAuthStore } from '../stores/authStore'

const navItems = [
  { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', href: '/super-admin' },
  { icon: <Building2 className="h-5 w-5" />, label: 'Organizations', href: '/super-admin/orgs' },
  { icon: <Activity className="h-5 w-5" />, label: 'Platform Monitoring', href: '/super-admin/monitoring' },
  { icon: <FileText className="h-5 w-5" />, label: 'Audit Logs', href: '/super-admin/audit' },
]

export default function SuperAdminLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar navItems={navItems} role="superadmin" />
      <div className="ml-[260px] flex flex-1 flex-col">
        <TopBar
          breadcrumb="OptiCareX Platform"
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
