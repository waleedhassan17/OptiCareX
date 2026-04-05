import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import type { UserRole } from './types'
import { useAuthStore } from './stores/authStore'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import AcceptInvitePage from './pages/auth/AcceptInvitePage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'
import UserListPage from './pages/admin/users/UserListPage'
import SettingsLayout from './pages/admin/settings/SettingsLayout'
import OrgSettingsPage from './pages/admin/settings/OrgSettingsPage'
import SitesPage from './pages/admin/settings/SitesPage'
import DevicesPage from './pages/admin/settings/DevicesPage'
import ReferralDirectoryPage from './pages/admin/settings/ReferralDirectoryPage'
import ProtocolsPage from './pages/admin/settings/ProtocolsPage'
import TaxonomyPage from './pages/admin/settings/TaxonomyPage'
import BillingPage from './pages/admin/settings/BillingPage'

// Layouts
import AdminLayout from './layouts/AdminLayout'
import TechnicianLayout from './layouts/TechnicianLayout'
import ClinicianLayout from './layouts/ClinicianLayout'
import CoordinatorLayout from './layouts/CoordinatorLayout'
import SuperAdminLayout from './layouts/SuperAdminLayout'

// Dashboard pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import TechnicianDashboardPage from './pages/technician/TechnicianDashboardPage'
import ClinicianDashboardPage from './pages/clinician/ClinicianDashboardPage'
import CoordinatorDashboardPage from './pages/coordinator/CoordinatorDashboardPage'
import SuperAdminDashboardPage from './pages/superadmin/SuperAdminDashboardPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const ROLE_ROUTES: Record<string, string> = {
  superadmin: '/super-admin',
  orgadmin: '/admin',
  technician: '/technician',
  clinician: '/clinician',
  coordinator: '/coordinator',
  patient: '/portal',
}

// ── Route Guards ─────────────────────────────────────────────────────

function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ returnUrl: location.pathname }} replace />
  }

  return <Outlet />
}

function RoleRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const user = useAuthStore((s) => s.user)

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

// ── Redirect authenticated user to their role dashboard ──────────────

function RoleRedirect() {
  const user = useAuthStore((s) => s.user)
  const route = user ? ROLE_ROUTES[user.role] || '/admin' : '/login'
  return <Navigate to={route} replace />
}

// ── Dashboard placeholder (empty layout for now) ─────────────────────

function DashboardShell({ title }: { title: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        <p className="mt-2 text-sm text-muted">Dashboard coming soon</p>
      </div>
    </div>
  )
}

// ── App Init Wrapper ─────────────────────────────────────────────────

function AppInit({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <>{children}</>
}

// ── Main App ─────────────────────────────────────────────────────────

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppInit>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Authenticated routes */}
            <Route element={<PrivateRoute />}>
              {/* Root → role-based redirect */}
              <Route index element={<RoleRedirect />} />

              {/* SuperAdmin */}
              <Route element={<RoleRoute allowedRoles={['superadmin']} />}>
                <Route path="/super-admin" element={<SuperAdminLayout />}>
                  <Route index element={<SuperAdminDashboardPage />} />
                </Route>
              </Route>

              {/* OrgAdmin */}
              <Route element={<RoleRoute allowedRoles={['superadmin', 'orgadmin']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="users" element={<UserListPage />} />
                  <Route path="settings" element={<SettingsLayout />}>
                    <Route index element={<OrgSettingsPage />} />
                    <Route path="sites" element={<SitesPage />} />
                    <Route path="devices" element={<DevicesPage />} />
                    <Route path="referral-directory" element={<ReferralDirectoryPage />} />
                    <Route path="protocols" element={<ProtocolsPage />} />
                    <Route path="taxonomy" element={<TaxonomyPage />} />
                    <Route path="billing" element={<BillingPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Technician */}
              <Route element={<RoleRoute allowedRoles={['superadmin', 'orgadmin', 'technician']} />}>
                <Route path="/technician" element={<TechnicianLayout />}>
                  <Route index element={<TechnicianDashboardPage />} />
                </Route>
              </Route>

              {/* Clinician */}
              <Route element={<RoleRoute allowedRoles={['superadmin', 'orgadmin', 'clinician']} />}>
                <Route path="/clinician" element={<ClinicianLayout />}>
                  <Route index element={<ClinicianDashboardPage />} />
                </Route>
              </Route>

              {/* Coordinator */}
              <Route element={<RoleRoute allowedRoles={['superadmin', 'orgadmin', 'coordinator']} />}>
                <Route path="/coordinator" element={<CoordinatorLayout />}>
                  <Route index element={<CoordinatorDashboardPage />} />
                </Route>
              </Route>

              {/* Patient */}
              <Route element={<RoleRoute allowedRoles={['patient']} />}>
                <Route path="/portal" element={<DashboardShell title="Patient Portal" />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppInit>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
