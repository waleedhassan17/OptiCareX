import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Device, Site } from '../../../types'

import { devicesApi, sitesApi } from '../../../api/tenants.api'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Select from '../../../components/Select'
import Badge from '../../../components/Badge'
import Modal from '../../../components/Modal'
import PageHeader from '../../../components/PageHeader'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ConfirmDialog from '../../../components/ConfirmDialog'

// ── Add device modal ─────────────────────────────────────────────────

interface DeviceFormData {
  siteId: string
  identifier: string
  cameraModel: string
  serialNumber: string
  captureNotes: string
}

function AddDeviceModal({
  isOpen,
  onClose,
  sites,
}: {
  isOpen: boolean
  onClose: () => void
  sites: Site[]
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeviceFormData>({
    defaultValues: { siteId: sites[0]?.id ?? '', identifier: '', cameraModel: '', serialNumber: '', captureNotes: '' },
  })

  const mutation = useMutation({
    mutationFn: (data: DeviceFormData) => devicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Device added.')
      reset()
      onClose()
    },
    onError: () => toast.error('Failed to add device.'),
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Device" size="md">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <Select
          label="Site"
          options={sites.map((s) => ({ value: s.id, label: s.name }))}
          {...register('siteId', { required: 'Site is required' })}
          error={errors.siteId?.message}
        />
        <Input
          label="Identifier"
          {...register('identifier', { required: 'Identifier is required' })}
          error={errors.identifier?.message}
        />
        <Input label="Camera Model" {...register('cameraModel')} />
        <Input label="Serial Number" {...register('serialNumber')} />
        <Input label="Capture Notes" {...register('captureNotes')} />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Add Device</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main page ────────────────────────────────────────────────────────

export default function DevicesPage() {
  const queryClient = useQueryClient()
  const [siteFilter, setSiteFilter] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null)

  const { data: sitesData } = useQuery({
    queryKey: ['sites'],
    queryFn: () => sitesApi.list({ page_size: 100 }),
  })

  const { data: devicesData, isLoading } = useQuery({
    queryKey: ['devices', siteFilter],
    queryFn: () => devicesApi.list(siteFilter ? { site: siteFilter } : {}),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => devicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Device deactivated.')
      setDeleteTarget(null)
    },
    onError: () => {
      toast.error('Failed to delete device.')
      setDeleteTarget(null)
    },
  })

  const sites = sitesData?.results ?? []
  const devices = devicesData?.results ?? []

  // Group devices by site
  const siteMap = new Map<string, Site>()
  sites.forEach((s) => siteMap.set(s.id, s))

  const grouped = new Map<string, Device[]>()
  devices.forEach((d) => {
    const key = d.siteId || 'unknown'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(d)
  })

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Devices"
        subtitle="Manage imaging devices across sites."
        breadcrumbs={[
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Devices' },
        ]}
        actions={[
          <select
            key="filter"
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text"
          >
            <option value="">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>,
          <Button key="add" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
            Add Device
          </Button>,
        ]}
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
      ) : devices.length === 0 ? (
        <div className="py-16 text-center text-muted">No devices found.</div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([siteId, siteDevices]) => {
            const site = siteMap.get(siteId)
            return (
              <div key={siteId}>
                <h3 className="mb-2 text-sm font-semibold text-muted uppercase tracking-wide">
                  {site?.name ?? 'Unknown Site'}
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-muted">Identifier</th>
                        <th className="px-4 py-3 font-medium text-muted">Camera Model</th>
                        <th className="px-4 py-3 font-medium text-muted">Serial</th>
                        <th className="px-4 py-3 font-medium text-muted">Last Used</th>
                        <th className="px-4 py-3 font-medium text-muted">Status</th>
                        <th className="px-4 py-3 font-medium text-muted w-16" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {siteDevices.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-text">{d.identifier}</td>
                          <td className="px-4 py-3 text-text">{d.cameraModel || '—'}</td>
                          <td className="px-4 py-3 text-text">{d.serialNumber || '—'}</td>
                          <td className="px-4 py-3 text-text">
                            {d.lastUsedAt ? format(new Date(d.lastUsedAt), 'MMM d, yyyy') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={d.isActive ? 'success' : 'danger'}>
                              {d.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setDeleteTarget(d)}
                              className="rounded p-1 text-muted hover:bg-red-50 hover:text-danger"
                              title="Deactivate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {addOpen && (
        <AddDeviceModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          sites={sites.filter((s) => s.isActive)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Deactivate Device"
        message={`Are you sure you want to deactivate "${deleteTarget?.identifier}"?`}
        confirmLabel="Deactivate"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
