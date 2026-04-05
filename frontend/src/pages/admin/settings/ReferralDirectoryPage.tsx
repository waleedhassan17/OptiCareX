import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Mail, Phone, MapPin, Send } from 'lucide-react'
import type { ReferralDestination } from '../../../types'

import { referralDestinationsApi } from '../../../api/tenants.api'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Textarea from '../../../components/Textarea'
import Badge from '../../../components/Badge'
import Modal from '../../../components/Modal'
import PageHeader from '../../../components/PageHeader'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ConfirmDialog from '../../../components/ConfirmDialog'
import SearchBar from '../../../components/SearchBar'

// ── Referral form modal ──────────────────────────────────────────────

interface RefFormData {
  name: string
  specialty: string
  contactName: string
  contactEmail: string
  contactPhone: string
  fax: string
  address: string
  routingNotes: string
}

function ReferralFormModal({
  isOpen,
  onClose,
  dest,
}: {
  isOpen: boolean
  onClose: () => void
  dest?: ReferralDestination | null
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RefFormData>({
    defaultValues: dest
      ? {
          name: dest.name,
          specialty: dest.specialty ?? '',
          contactName: dest.contactName ?? '',
          contactEmail: dest.contactEmail ?? '',
          contactPhone: dest.contactPhone ?? '',
          fax: dest.fax ?? '',
          address: dest.address ?? '',
          routingNotes: dest.routingNotes ?? '',
        }
      : { name: '', specialty: '', contactName: '', contactEmail: '', contactPhone: '', fax: '', address: '', routingNotes: '' },
  })

  const createMutation = useMutation({
    mutationFn: (data: RefFormData) => referralDestinationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-destinations'] })
      toast.success('Destination added.')
      reset()
      onClose()
    },
    onError: () => toast.error('Failed to create destination.'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: RefFormData) => referralDestinationsApi.update(dest!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-destinations'] })
      toast.success('Destination updated.')
      onClose()
    },
    onError: () => toast.error('Failed to update destination.'),
  })

  const onSubmit = (data: RefFormData) => {
    if (dest) updateMutation.mutate(data)
    else createMutation.mutate(data)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dest ? 'Edit Destination' : 'Add Destination'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Input label="Specialty" {...register('specialty')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Contact Name" {...register('contactName')} />
          <Input label="Contact Email" type="email" {...register('contactEmail')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" {...register('contactPhone')} />
          <Input label="Fax" {...register('fax')} />
        </div>
        <Input label="Address" {...register('address')} />
        <Textarea label="Routing Notes" rows={3} {...register('routingNotes')} />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
            {dest ? 'Save' : 'Add Destination'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main page ────────────────────────────────────────────────────────

export default function ReferralDirectoryPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editDest, setEditDest] = useState<ReferralDestination | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ReferralDestination | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['referral-destinations', search],
    queryFn: () => referralDestinationsApi.list(search ? { search } : {}),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => referralDestinationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-destinations'] })
      toast.success('Destination deactivated.')
      setDeleteTarget(null)
    },
    onError: () => {
      toast.error('Failed to delete destination.')
      setDeleteTarget(null)
    },
  })

  const testMutation = useMutation({
    mutationFn: (id: string) => referralDestinationsApi.testContact(id),
    onSuccess: () => toast.success('Test email sent successfully.'),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to send test email.'
      toast.error(msg)
    },
  })

  const dests = data?.results ?? []

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Referral Directory"
        subtitle="Manage referral destinations for patient routing."
        breadcrumbs={[
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Referral Directory' },
        ]}
        actions={[
          <Button key="add" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditDest(null); setFormOpen(true) }}>
            Add Destination
          </Button>,
        ]}
      />

      <div className="mb-6">
        <SearchBar
          onSearch={setSearch}
          placeholder="Search by name or specialty…"
        />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
      ) : dests.length === 0 ? (
        <div className="py-16 text-center text-muted">No referral destinations found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dests.map((dest) => (
            <div
              key={dest.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-lg"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-text">{dest.name}</h3>
                  {dest.specialty && (
                    <Badge variant="info" className="mt-1">{dest.specialty}</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditDest(dest); setFormOpen(true) }}
                    className="rounded p-1 text-muted hover:bg-gray-100 hover:text-text"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(dest)}
                    className="rounded p-1 text-muted hover:bg-red-50 hover:text-danger"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted">
                {dest.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{dest.contactEmail}</span>
                  </div>
                )}
                {dest.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{dest.contactPhone}</span>
                  </div>
                )}
                {dest.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="line-clamp-2">{dest.address}</span>
                  </div>
                )}
                {dest.routingNotes && (
                  <p className="mt-2 text-xs italic line-clamp-2">{dest.routingNotes}</p>
                )}
              </div>

              {dest.contactEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                  isLoading={testMutation.isPending}
                  onClick={() => testMutation.mutate(dest.id)}
                >
                  Test Contact
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <ReferralFormModal
          isOpen={formOpen}
          onClose={() => { setFormOpen(false); setEditDest(null) }}
          dest={editDest}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Deactivate Destination"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"?`}
        confirmLabel="Deactivate"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
