import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../../components/Modal'
import Input from '../../../components/Input'
import Select from '../../../components/Select'
import Button from '../../../components/Button'
import type { Site } from '../../../types'
import { UserRole } from '../../../types'
import { invitationsApi } from '../../../api/users.api'

const ROLE_OPTIONS = [
  { value: '', label: 'Select a role' },
  { value: UserRole.OrgAdmin, label: 'Org Admin' },
  { value: UserRole.Technician, label: 'Technician' },
  { value: UserRole.Clinician, label: 'Clinician' },
  { value: UserRole.Coordinator, label: 'Coordinator' },
]

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  sites: Site[]
}

interface FormValues {
  email: string
  role: string
  site: string
}

export default function InviteUserModal({ isOpen, onClose, sites }: InviteUserModalProps) {
  const queryClient = useQueryClient()
  const [sentEmail, setSentEmail] = useState<string | null>(null)

  const siteOptions = [
    { value: '', label: 'No site assignment' },
    ...sites.map((s) => ({ value: s.id, label: s.name })),
  ]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { email: '', role: '', site: '' },
  })

  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; role: string; site?: string }) =>
      invitationsApi.create(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      setSentEmail(variables.email)
    },
    onError: () => toast.error('Failed to send invitation'),
  })

  const onSubmit = (values: FormValues) => {
    inviteMutation.mutate({
      email: values.email,
      role: values.role,
      ...(values.site && { site: values.site }),
    })
  }

  const handleClose = () => {
    reset()
    setSentEmail(null)
    onClose()
  }

  // Success state
  if (sentEmail) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Invitation Sent" size="sm">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10">
            <CheckCircle className="h-6 w-6 text-teal" />
          </div>
          <p className="mb-1 text-sm font-medium text-text">Invitation sent to</p>
          <p className="mb-2 text-sm text-secondary">{sentEmail}</p>
          <p className="mb-6 text-xs text-muted">
            The invitation link expires in 72 hours. You can resend it from the Invitations tab.
          </p>
          <Button variant="primary" fullWidth onClick={handleClose}>
            Done
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Team Member">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="colleague@example.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
          })}
        />

        <Select
          label="Role"
          options={ROLE_OPTIONS}
          error={errors.role?.message}
          {...register('role', { required: 'Role is required' })}
        />

        <Select
          label="Site (optional)"
          options={siteOptions}
          {...register('site')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={inviteMutation.isPending}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  )
}
