import { useState } from 'react'
import { Menu, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react'

interface TopBarProps {
  breadcrumb?: string
  notificationCount?: number
  userName?: string
  avatarUrl?: string
  onMenuClick?: () => void
  onLogout?: () => void
}

export default function TopBar({
  breadcrumb,
  notificationCount = 0,
  userName,
  avatarUrl,
  onMenuClick,
  onLogout,
}: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface px-4">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="rounded-md p-2 text-muted hover:bg-gray-100 hover:text-text"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {breadcrumb && (
          <span className="text-sm text-muted">{breadcrumb}</span>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative rounded-md p-2 text-muted hover:bg-gray-100 hover:text-text">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-md p-2 text-sm text-text hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            {userName && <span className="hidden sm:inline">{userName}</span>}
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-1 w-48 rounded-lg border border-border bg-surface py-1 shadow-card">
                <a
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-gray-50"
                >
                  <User className="h-4 w-4 text-muted" />
                  Profile
                </a>
                <a
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 text-muted" />
                  Settings
                </a>
                <hr className="my-1 border-border" />
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
