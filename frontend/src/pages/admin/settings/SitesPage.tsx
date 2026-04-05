import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import type { Site } from '../../../types'

import { sitesApi } from '../../../api/tenants.api'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Badge from '../../../components/Badge'
import PageHeader from '../../../components/PageHeader'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ConfirmDialog from '../../../components/ConfirmDialog'

// ── Slide-over form ──────────────────────────────────────────────────

interface SiteFormData {
  name: string
  address: string
  timezone: string
  contactName: string
  contactEmail: string
  contactPhone: string
}

function SiteSlideOver({
  isOpen,
  onClose,
  site,
}: {
  isOpen: boolean
  onClose: () => void
  site?: Site | null
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SiteFormData>({
    defaultValues: site
      ? {
          name: site.name,
          address: site.address ?? '',
          timezone: site.timezone ?? 'UTC',
          contactName: site.contactName ?? '',
          contactEmail: site.contactEmail ?? '',
          contactPhone: site.contactPhone ?? '',
        }
      : { name: '', address: '', timezone: 'UTC', contactName: '', contactEmail: '', contactPhone: '' },
  })

  const createMutation = useMutation({
    mutationFn: (data: SiteFormData) => sitesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success('Site created.')
      reset()
      onClose()
    },
    onError: () => toast.error('Failed to create site.'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: SiteFormData) => sitesApi.update(site!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success('Site updated.')
      onClose()
    },
    onError: () => toast.error('Failed to update site.'),
  })

  const onSubmit = (data: SiteFormData) => {
    if (site) updateMutation.mutate(data)
    else createMutation.mutate(data)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md overflow-y-auto bg-surface p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">
            {site ? 'Edit Site' : 'Add Site'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Site Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Input label="Address" {...register('address')} />
          <Input label="Timezone" {...register('timezone')} />
          <Input label="Contact Name" {...register('contactName')} />
          <Input label="Contact Email" type="email" {...register('contactEmail')} />
          <Input label="Contact Phone" {...register('contactPhone')} />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {site ? 'Save' : 'Create Site'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Inline edit row ──────────────────────────────────────────────────

function InlineEditRow({
  site,
  onCancel,
}: {
  site: Site
  onCancel: () => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit } = useForm<{ name: string; address: string; timezone: string }>({
    defaultValues: { name: site.name, address: site.address ?? '', timezone: site.timezone ?? '' },
  })

  const mutation = useMutation({
    mutationFn: (data: { name: string; address: string; timezone: string }) =>
      sitesApi.update(site.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success('Site updated.')
      onCancel()
    },
    onError: () => toast.error('Failed to update site.'),
  })

  return (
    <tr className="bg-primary/5">
      <td className="px-4 py-2">
        <input
          {...register('name')}
          className="h-8 w-full rounded border border-border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </td>
      <td className="px-4 py-2">
        <input
          {...register('address')}
          className="h-8 w-full rounded border border-border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </td>
      <td className="px-4 py-2">
        <input
          {...register('timezone')}
          className="h-8 w-full rounded border border-border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </td>
      <td className="px-4 py-2">
        <Badge variant={site.isActive ? 'success' : 'danger'}>
          {site.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleSubmit((data) => mutation.mutate(data))}
            className="rounded p-1 text-teal-600 hover:bg-teal-50"
            title="Save"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={onCancel}
            className="rounded p-1 text-muted hover:bg-gray-100"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Main page ────────────────────────────────────────────────────────

export default function SitesPage() {
  const queryClient = useQueryClient()
  const [slideOpen, setSlideOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Site | null>(null)
  const [filterActive, setFilterActive] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['sites', filterActive],
    queryFn: () => sitesApi.list(filterActive ? { is_active: filterActive } : {}),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sitesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      toast.success('Site deactivated.')
      setDeleteTarget(null)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to delete site.'
      toast.error(msg)
      setDeleteTarget(null)
    },
  })

  const sites = data?.results ?? []

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Sites"
        subtitle="Manage clinic locations."
        breadcrumbs={[
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Sites' },
        ]}
        actions={[
          <select
            key="filter"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>,
          <Button key="add" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setSlideOpen(true)}>
            Add Site
          </Button>,
        ]}
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-muted">Name</th>
                <th className="px-4 py-3 font-medium text-muted">Address</th>
                <th className="px-4 py-3 font-medium text-muted">Timezone</th>
                <th className="px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3 font-medium text-muted w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No sites found.
                  </td>
                </tr>
              ) : (
                sites.map((site) =>
                  editingId === site.id ? (
                    <InlineEditRow
                      key={site.id}
                      site={site}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <tr key={site.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-text">{site.name}</td>
                      <td className="px-4 py-3 text-text">{site.address || '—'}</td>
                      <td className="px-4 py-3 text-text">{site.timezone || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={site.isActive ? 'success' : 'danger'}>
                          {site.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingId(site.id)}
                            className="rounded p-1 text-muted hover:bg-gray-100 hover:text-text"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(site)}
                            className="rounded p-1 text-muted hover:bg-red-50 hover:text-danger"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      <SiteSlideOver
        isOpen={slideOpen}
        onClose={() => setSlideOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Deactivate Site"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"? Active cases at this site may prevent deletion.`}
        confirmLabel="Deactivate"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
