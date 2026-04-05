import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Upload,
} from 'lucide-react'

import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { useAuthStore } from '../stores/authStore'

const navItems = [
  { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', href: '/technician' },
  { icon: <PlusCircle className="h-5 w-5" />, label: 'New Case', href: '/technician/new-case' },
  { icon: <FolderOpen className="h-5 w-5" />, label: 'My Cases', href: '/technician/cases' },
  { icon: <Upload className="h-5 w-5" />, label: 'Batch Uploads', href: '/technician/batch' },
]

export default function TechnicianLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar navItems={navItems} role="technician" />
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
