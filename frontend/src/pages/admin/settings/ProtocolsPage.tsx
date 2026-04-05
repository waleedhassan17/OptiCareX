import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Protocol, ProtocolGroup } from '../../../types'

import { protocolsApi } from '../../../api/tenants.api'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Textarea from '../../../components/Textarea'
import Select from '../../../components/Select'
import Badge from '../../../components/Badge'
import Modal from '../../../components/Modal'
import PageHeader from '../../../components/PageHeader'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ConfirmDialog from '../../../components/ConfirmDialog'

// ── Create protocol modal ────────────────────────────────────────────

interface ProtocolFormData {
  name: string
  severityLabel: string
  recommendedAction: string
  followUpIntervalDays: string
  urgency: string
}

function CreateProtocolModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProtocolFormData>({
    defaultValues: { name: '', severityLabel: '', recommendedAction: '', followUpIntervalDays: '', urgency: 'medium' },
  })

  const mutation = useMutation({
    mutationFn: (data: ProtocolFormData) =>
      protocolsApi.create({
        name: data.name,
        severityLabel: data.severityLabel,
        recommendedAction: data.recommendedAction,
        followUpIntervalDays: data.followUpIntervalDays ? Number(data.followUpIntervalDays) : undefined,
        urgency: data.urgency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocols'] })
      toast.success('Protocol created.')
      reset()
      onClose()
    },
    onError: () => toast.error('Failed to create protocol.'),
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Protocol" size="md">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <Input
          label="Name"
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
        />
        <Input label="Severity Label" {...register('severityLabel')} />
        <Textarea label="Recommended Action" rows={3} {...register('recommendedAction')} />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Follow-up Interval (days)"
            type="number"
            {...register('followUpIntervalDays')}
          />
          <Select
            label="Urgency"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            {...register('urgency')}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Create</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Protocol group card ──────────────────────────────────────────────

const urgencyColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

function ProtocolGroupCard({ group }: { group: ProtocolGroup }) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Protocol | null>(null)

  const active = group.versions.find((v) => v.isActive)

  const newVersionMutation = useMutation({
    mutationFn: (id: string) => protocolsApi.newVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocols'] })
      toast.success('New version created.')
    },
    onError: () => toast.error('Failed to create new version.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => protocolsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocols'] })
      toast.success('Protocol deactivated.')
      setDeleteTarget(null)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to deactivate protocol.'
      toast.error(msg)
      setDeleteTarget(null)
    },
  })

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted hover:text-text"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          <div>
            <h3 className="text-base font-semibold text-text">{group.name}</h3>
            <p className="text-xs text-muted">
              {group.versions.length} version{group.versions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {active && (
            <Badge variant="success" className="bg-teal-100/60 text-teal-800">
              Active v{active.version}
            </Badge>
          )}
          {active && (
            <Badge variant={urgencyColors[active.urgency] ?? 'default'}>
              {active.urgency}
            </Badge>
          )}
          {active && (
            <Button
              variant="outline"
              size="sm"
              isLoading={newVersionMutation.isPending}
              onClick={() => newVersionMutation.mutate(active.id)}
            >
              New Version
            </Button>
          )}
        </div>
      </div>

      {/* Version history (collapsed by default) */}
      {expanded && (
        <div className="border-t border-border">
          <div className="divide-y divide-border">
            {group.versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text">v{v.version}</span>
                  {v.isActive ? (
                    <Badge variant="success" className="bg-teal-100/60 text-teal-800">Active</Badge>
                  ) : (
                    <Badge variant="default">Superseded</Badge>
                  )}
                  {v.severityLabel && (
                    <span className="text-xs text-muted">{v.severityLabel}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">
                    {v.createdAt ? format(new Date(v.createdAt), 'MMM d, yyyy') : ''}
                  </span>
                  {v.isActive && (
                    <button
                      onClick={() => setDeleteTarget(v)}
                      className="rounded p-1 text-muted hover:bg-red-50 hover:text-danger"
                      title="Deactivate"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Deactivate Protocol"
        message="Are you sure? This protocol cannot be deactivated if used in active cases."
        confirmLabel="Deactivate"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────

export default function ProtocolsPage() {
  const [createOpen, setCreateOpen] = useState(false)

  const { data: groups, isLoading } = useQuery({
    queryKey: ['protocols'],
    queryFn: () => protocolsApi.list(),
  })

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Protocols"
        subtitle="Define clinical protocols and action paths."
        breadcrumbs={[
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Protocols' },
        ]}
        actions={[
          <Button key="add" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
            New Protocol
          </Button>,
        ]}
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
      ) : !groups || groups.length === 0 ? (
        <div className="py-16 text-center text-muted">No protocols defined yet.</div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <ProtocolGroupCard key={g.name} group={g} />
          ))}
        </div>
      )}

      {createOpen && (
        <CreateProtocolModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  )
}
