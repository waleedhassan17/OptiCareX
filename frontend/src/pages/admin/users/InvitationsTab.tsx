import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Trash2 } from 'lucide-react'
import { format, isPast } from 'date-fns'
import toast from 'react-hot-toast'
import Badge from '../../../components/Badge'
import Pagination from '../../../components/Pagination'
import ConfirmDialog from '../../../components/ConfirmDialog'
import type { Site, Invitation } from '../../../types'
import { invitationsApi } from '../../../api/users.api'

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  orgadmin: 'Org Admin',
  technician: 'Technician',
  clinician: 'Clinician',
  coordinator: 'Coordinator',
  patient: 'Patient',
}

interface InvitationsTabProps {
  sites: Site[]
}

export default function InvitationsTab({ sites }: InvitationsTabProps) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [cancelTarget, setCancelTarget] = useState<Invitation | null>(null)

  const invQuery = useQuery({
    queryKey: ['invitations', page],
    queryFn: () => invitationsApi.list({ page }),
  })

  const resendMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.resend(id),
    onSuccess: () => {
      toast.success('Invitation resent')
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
    onError: () => toast.error('Failed to resend invitation'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.cancel(id),
    onSuccess: () => {
      toast.success('Invitation cancelled')
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      setCancelTarget(null)
    },
    onError: () => toast.error('Failed to cancel invitation'),
  })

  const invitations: Invitation[] = invQuery.data?.results ?? []
  const totalCount = invQuery.data?.count ?? 0
  const totalPages = Math.ceil(totalCount / 25)

  const getStatus = (inv: Invitation): 'accepted' | 'expired' | 'pending' => {
    if (inv.isAccepted) return 'accepted'
    if (isPast(new Date(inv.expiresAt))) return 'expired'
    return 'pending'
  }

  const statusBadge = (status: 'accepted' | 'expired' | 'pending') => {
    switch (status) {
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>
      case 'expired':
        return <Badge variant="default">Expired</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-muted">Email</th>
              <th className="px-4 py-3 font-medium text-muted">Role</th>
              <th className="px-4 py-3 font-medium text-muted">Site</th>
              <th className="px-4 py-3 font-medium text-muted">Sent</th>
              <th className="px-4 py-3 font-medium text-muted">Expires</th>
              <th className="px-4 py-3 font-medium text-muted">Status</th>
              <th className="px-4 py-3 font-medium text-muted w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invQuery.isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              : invitations.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted">
                        No invitations yet.
                      </td>
                    </tr>
                  )
                : invitations.map((inv) => {
                    const status = getStatus(inv)
                    const siteName = sites.find((s) => s.id === inv.site)?.name
                    const isExpired = status === 'expired'
                    return (
                      <tr
                        key={inv.id}
                        className={isExpired ? 'text-muted italic' : ''}
                      >
                        <td className="px-4 py-3 font-medium">{inv.email}</td>
                        <td className="px-4 py-3">{ROLE_LABEL[inv.role] || inv.role}</td>
                        <td className="px-4 py-3 text-muted">{siteName || '—'}</td>
                        <td className="px-4 py-3 text-muted">
                          {format(new Date(inv.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {format(new Date(inv.expiresAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">{statusBadge(status)}</td>
                        <td className="px-4 py-3">
                          {status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => resendMutation.mutate(inv.id)}
                                disabled={resendMutation.isPending}
                                className="rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-blue-50"
                                title="Resend"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setCancelTarget(inv)}
                                className="rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-red-50"
                                title="Cancel"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
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

      {cancelTarget && (
        <ConfirmDialog
          isOpen
          title="Cancel Invitation"
          message={`Cancel the invitation to ${cancelTarget.email}? They will no longer be able to accept it.`}
          confirmLabel="Cancel Invitation"
          onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
          onCancel={() => setCancelTarget(null)}
        />
      )}
    </>
  )
}
