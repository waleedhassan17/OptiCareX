import { NavLink, Outlet } from 'react-router-dom'
import {
  Building2,
  MapPin,
  Camera,
  Share2,
  FileText,
  Tags,
  CreditCard,
  Bell,
} from 'lucide-react'
import clsx from 'clsx'

const settingsNav = [
  { label: 'Organization', href: '/admin/settings', icon: Building2, end: true },
  { label: 'Sites', href: '/admin/settings/sites', icon: MapPin },
  { label: 'Devices', href: '/admin/settings/devices', icon: Camera },
  { label: 'Referral Directory', href: '/admin/settings/referral-directory', icon: Share2 },
  { label: 'Protocols', href: '/admin/settings/protocols', icon: FileText },
  { label: 'Clinical Taxonomy', href: '/admin/settings/taxonomy', icon: Tags },
  { label: 'Billing & Plan', href: '/admin/settings/billing', icon: CreditCard },
  { label: 'Notifications', href: '/admin/settings/notifications', icon: Bell },
]

export default function SettingsLayout() {
  return (
    <div className="flex min-h-0 -mx-6 -my-6">
      {/* Settings sidebar */}
      <aside className="w-[240px] flex-shrink-0 border-r border-border bg-surface overflow-y-auto">
        <div className="sticky top-0 px-4 py-6">
          <h2 className="mb-4 text-lg font-bold text-text">Settings</h2>
          <nav className="space-y-1">
            {settingsNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:bg-gray-100 hover:text-text'
                  )
                }
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
