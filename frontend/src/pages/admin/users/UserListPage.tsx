import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  UserPlus, Send, Users, UserCheck, Stethoscope, Camera,
} from 'lucide-react'
import { format } from 'date-fns'
import PageHeader from '../../../components/PageHeader'
import SearchBar from '../../../components/SearchBar'
import Badge from '../../../components/Badge'
import Button from '../../../components/Button'
import Tabs from '../../../components/Tabs'
import Pagination from '../../../components/Pagination'
import type { User, Site } from '../../../types'
import { UserRole } from '../../../types'
import { usersApi } from '../../../api/users.api'
import { tenantsApi } from '../../../api/tenants.api'
import UserDetailDrawer from './UserDetailDrawer'
import UserFormModal from './UserFormModal'
import InviteUserModal from './InviteUserModal'
import InvitationsTab from './InvitationsTab'

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'orgadmin', label: 'Org Admin' },
  { value: 'technician', label: 'Technician' },
  { value: 'clinician', label: 'Clinician' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'patient', label: 'Patient' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Active' },
  { value: 'all', label: 'All' },
]

const ROLE_BADGE: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'purple' | 'default' | 'danger' }> = {
  [UserRole.SuperAdmin]: { label: 'Super Admin', variant: 'danger' },
  [UserRole.OrgAdmin]: { label: 'Org Admin', variant: 'purple' },
  [UserRole.Technician]: { label: 'Technician', variant: 'info' },
  [UserRole.Clinician]: { label: 'Clinician', variant: 'success' },
  [UserRole.Coordinator]: { label: 'Coordinator', variant: 'warning' },
  [UserRole.Patient]: { label: 'Patient', variant: 'default' },
}

export default function UserListPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  const usersQuery = useQuery({
    queryKey: ['users', search, roleFilter, siteFilter, statusFilter, page],
    queryFn: () =>
      usersApi.list({
        search,
        ...(roleFilter && { role: roleFilter }),
        ...(siteFilter && { site: siteFilter }),
        ...(statusFilter !== 'all' && { is_active: true }),
        page,
      }),
  })

  const sitesQuery = useQuery({
    queryKey: ['sites'],
    queryFn: () => tenantsApi.listSites(),
  })

  const sites: Site[] = sitesQuery.data?.results ?? []
  const users: User[] = usersQuery.data?.results ?? []
  const totalCount = usersQuery.data?.count ?? 0
  const totalPages = Math.ceil(totalCount / 25)

  const activeCount = users.filter((u) => u.isActive).length
  const techCount = users.filter((u) => u.role === 'technician').length
  const clinicianCount = users.filter((u) => u.role === 'clinician').length

  const handleSearch = useCallback((v: string) => {
    setSearch(v)
    setPage(1)
  }, [])

  const openDrawer = (user: User) => {
    setSelectedUser(user)
    setDrawerOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormModalOpen(true)
  }

  const tabItems = [
    { id: 'users', label: 'Team Members', badge: totalCount },
    { id: 'invitations', label: 'Invitations' },
  ]

  const statCards = [
    { label: 'Total Users', value: totalCount, icon: <Users className="h-5 w-5" />, borderColor: 'border-l-primary' },
    { label: 'Active', value: activeCount, icon: <UserCheck className="h-5 w-5" />, borderColor: 'border-l-teal' },
    { label: 'Technicians', value: techCount, icon: <Camera className="h-5 w-5" />, borderColor: 'border-l-secondary' },
    { label: 'Clinicians', value: clinicianCount, icon: <Stethoscope className="h-5 w-5" />, borderColor: 'border-l-amber' },
  ]

  return (
    <div className="min-h-screen bg-bg p-6">
      <PageHeader
        title="Team Members"
        subtitle="Manage your organization's users and invitations"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Team Members' }]}
        actions={[
          <Button
            key="invite"
            variant="outline"
            leftIcon={<Send className="h-4 w-4" />}
            onClick={() => setInviteModalOpen(true)}
          >
            Invite User
          </Button>,
          <Button
            key="add"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={openCreateModal}
          >
            Add User Directly
          </Button>,
        ]}
      />

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border-l-4 bg-surface p-4 shadow-card ${card.borderColor}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-text">{card.value}</p>
              </div>
              <div className="text-muted">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs tabs={tabItems} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'users' ? (
        <div className="mt-4">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <SearchBar
              placeholder="Search by name or email…"
              onSearch={handleSearch}
              className="w-64"
            />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={siteFilter}
              onChange={(e) => { setSiteFilter(e.target.value); setPage(1) }}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted">Name</th>
                  <th className="px-4 py-3 font-medium text-muted">Email</th>
                  <th className="px-4 py-3 font-medium text-muted">Role</th>
                  <th className="px-4 py-3 font-medium text-muted">Site</th>
                  <th className="px-4 py-3 font-medium text-muted">Status</th>
                  <th className="px-4 py-3 font-medium text-muted">Last Login</th>
                  <th className="px-4 py-3 font-medium text-muted w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usersQuery.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : users.length === 0
                    ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted">
                            No users found.
                          </td>
                        </tr>
                      )
                    : users.map((user) => {
                        const roleBadge = ROLE_BADGE[user.role] || { label: user.role, variant: 'default' as const }
                        const siteName = sites.find((s) => s.id === user.siteId)?.name
                        return (
                          <tr
                            key={user.id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => openDrawer(user)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                  {user.fullName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <span className="font-medium text-text">{user.fullName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted">{user.email}</td>
                            <td className="px-4 py-3">
                              <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                            </td>
                            <td className="px-4 py-3 text-muted">{siteName || '—'}</td>
                            <td className="px-4 py-3">
                              {user.isActive ? (
                                <Badge variant="success">Active</Badge>
                              ) : (
                                <Badge variant="default">Inactive</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted">
                              {user.lastLoginAt
                                ? format(new Date(user.lastLoginAt), 'MMM d, yyyy')
                                : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-blue-50"
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <InvitationsTab sites={sites} />
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && selectedUser && (
        <UserDetailDrawer
          user={selectedUser}
          sites={sites}
          onClose={() => { setDrawerOpen(false); setSelectedUser(null) }}
          onEdit={(u: User) => { setDrawerOpen(false); openEditModal(u) }}
          onRefresh={() => usersQuery.refetch()}
        />
      )}

      {/* Create / Edit Modal */}
      <UserFormModal
        isOpen={formModalOpen}
        onClose={() => { setFormModalOpen(false); setEditingUser(null) }}
        user={editingUser}
        sites={sites}
        onSuccess={() => usersQuery.refetch()}
      />

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        sites={sites}
      />
    </div>
  )
}
