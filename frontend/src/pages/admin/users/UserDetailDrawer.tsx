import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Mail, Shield, MapPin, Clock, Edit2, KeyRound, UserX, UserCheck } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Badge from '../../../components/Badge'
import Button from '../../../components/Button'
import Tabs from '../../../components/Tabs'
import ConfirmDialog from '../../../components/ConfirmDialog'
import type { User, Site } from '../../../types'
import { UserRole } from '../../../types'
import { usersApi } from '../../../api/users.api'
import { auditApi } from '../../../api/audit.api'
import { authApi } from '../../../api/auth.api'

const ROLE_BADGE: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'purple' | 'default' | 'danger' }> = {
  [UserRole.SuperAdmin]: { label: 'Super Admin', variant: 'danger' },
  [UserRole.OrgAdmin]: { label: 'Org Admin', variant: 'purple' },
  [UserRole.Technician]: { label: 'Technician', variant: 'info' },
  [UserRole.Clinician]: { label: 'Clinician', variant: 'success' },
  [UserRole.Coordinator]: { label: 'Coordinator', variant: 'warning' },
  [UserRole.Patient]: { label: 'Patient', variant: 'default' },
}

interface UserDetailDrawerProps {
  user: User
  sites: Site[]
  onClose: () => void
  onEdit: (user: User) => void
  onRefresh: () => void
}

export default function UserDetailDrawer({
  user,
  sites,
  onClose,
  onEdit,
  onRefresh,
}: UserDetailDrawerProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'reactivate' | 'reset' | null>(null)

  const siteName = sites.find((s) => s.id === user.siteId)?.name
  const roleBadge = ROLE_BADGE[user.role] || { label: user.role, variant: 'default' as const }
  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const auditQuery = useQuery({
    queryKey: ['audit', user.id],
    queryFn: () => auditApi.list({ actor: user.id, page_size: 10 }),
    enabled: activeTab === 'activity',
  })

  const deactivateMutation = useMutation({
    mutationFn: () => usersApi.deactivate(user.id),
    onSuccess: () => {
      toast.success('User deactivated')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onRefresh()
      onClose()
    },
    onError: () => toast.error('Failed to deactivate user'),
  })

  const reactivateMutation = useMutation({
    mutationFn: () => usersApi.reactivate(user.id),
    onSuccess: () => {
      toast.success('User reactivated')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onRefresh()
      onClose()
    },
    onError: () => toast.error('Failed to reactivate user'),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: () => authApi.forgotPassword(user.email),
    onSuccess: () => {
      toast.success('Password reset email sent')
      setConfirmAction(null)
    },
    onError: () => toast.error('Failed to send reset email'),
  })

  const handleConfirm = () => {
    if (confirmAction === 'deactivate') deactivateMutation.mutate()
    else if (confirmAction === 'reactivate') reactivateMutation.mutate()
    else if (confirmAction === 'reset') resetPasswordMutation.mutate()
  }

  const confirmMessages: Record<string, { title: string; message: string; label: string }> = {
    deactivate: {
      title: 'Deactivate User',
      message: `Are you sure you want to deactivate ${user.fullName}? They will lose access immediately.`,
      label: 'Deactivate',
    },
    reactivate: {
      title: 'Reactivate User',
      message: `Re-enable access for ${user.fullName}?`,
      label: 'Reactivate',
    },
    reset: {
      title: 'Reset Password',
      message: `Send a password reset email to ${user.email}?`,
      label: 'Send Reset',
    },
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-text">User Details</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile summary */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-text">{user.fullName}</h3>
              <p className="truncate text-sm text-muted">{user.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                {user.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="default">Inactive</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex gap-2 border-b border-border px-6 py-3">
          <Button size="sm" variant="outline" leftIcon={<Edit2 className="h-3.5 w-3.5" />} onClick={() => onEdit(user)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" leftIcon={<KeyRound className="h-3.5 w-3.5" />} onClick={() => setConfirmAction('reset')}>
            Reset Password
          </Button>
          {user.isActive ? (
            <Button size="sm" variant="danger" leftIcon={<UserX className="h-3.5 w-3.5" />} onClick={() => setConfirmAction('deactivate')}>
              Deactivate
            </Button>
          ) : (
            <Button size="sm" variant="primary" leftIcon={<UserCheck className="h-3.5 w-3.5" />} onClick={() => setConfirmAction('reactivate')}>
              Reactivate
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 pt-2">
          <Tabs
            tabs={[
              { id: 'profile', label: 'Profile' },
              { id: 'activity', label: 'Activity' },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'profile' ? (
            <div className="space-y-4">
              <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
              <DetailRow icon={<Shield className="h-4 w-4" />} label="Role" value={roleBadge.label} />
              <DetailRow icon={<MapPin className="h-4 w-4" />} label="Site" value={siteName || 'Not assigned'} />
              <DetailRow
                icon={<Clock className="h-4 w-4" />}
                label="Last Login"
                value={user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM d, yyyy h:mm a') : 'Never'}
              />
              <DetailRow
                icon={<Clock className="h-4 w-4" />}
                label="Created"
                value={format(new Date(user.createdAt), 'MMM d, yyyy')}
              />
              {user.phone && (
                <DetailRow icon={<Mail className="h-4 w-4" />} label="Phone" value={user.phone} />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {auditQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
                ))
              ) : !auditQuery.data?.results?.length ? (
                <p className="py-8 text-center text-sm text-muted">No recent activity</p>
              ) : (
                auditQuery.data.results.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-border px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text">{log.action}</span>
                      <span className="text-xs text-muted">
                        {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {log.resourceType}{log.resourceId ? ` #${log.resourceId.slice(0, 8)}` : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmDialog
          isOpen
          title={confirmMessages[confirmAction].title}
          message={confirmMessages[confirmAction].message}
          confirmLabel={confirmMessages[confirmAction].label}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted">{icon}</span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-text">{value}</p>
      </div>
    </div>
  )
}
