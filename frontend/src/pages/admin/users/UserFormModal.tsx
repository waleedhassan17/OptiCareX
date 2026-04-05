import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../../components/Modal'
import Input from '../../../components/Input'
import Select from '../../../components/Select'
import Button from '../../../components/Button'
import type { User, Site } from '../../../types'
import { UserRole } from '../../../types'
import { usersApi } from '../../../api/users.api'
import type { CreateUserPayload, UpdateUserPayload } from '../../../api/users.api'

const ROLE_OPTIONS = [
  { value: '', label: 'Select a role' },
  { value: UserRole.OrgAdmin, label: 'Org Admin' },
  { value: UserRole.Technician, label: 'Technician' },
  { value: UserRole.Clinician, label: 'Clinician' },
  { value: UserRole.Coordinator, label: 'Coordinator' },
]

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  sites: Site[]
  onSuccess: () => void
}

interface FormValues {
  fullName: string
  email: string
  role: string
  site: string
}

export default function UserFormModal({
  isOpen,
  onClose,
  user,
  sites,
  onSuccess,
}: UserFormModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!user
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      role: user?.role ?? '',
      site: user?.siteId ?? '',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const result = await usersApi.create(payload)
      return result as User & { temporaryPassword?: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
      if (data.temporaryPassword) {
        setTempPassword(data.temporaryPassword as string)
      } else {
        toast.success('User created')
        handleClose()
      }
    },
    onError: () => toast.error('Failed to create user'),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserPayload) => usersApi.update(user!.id, payload),
    onSuccess: () => {
      toast.success('User updated')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
      handleClose()
    },
    onError: () => toast.error('Failed to update user'),
  })

  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateMutation.mutate({
        fullName: values.fullName,
        role: values.role,
        site: values.site || null,
      })
    } else {
      createMutation.mutate({
        email: values.email,
        fullName: values.fullName,
        role: values.role,
        ...(values.site && { site: values.site }),
      })
    }
  }

  const handleClose = () => {
    reset()
    setTempPassword(null)
    setCopied(false)
    onClose()
  }

  const copyPassword = async () => {
    if (!tempPassword) return
    await navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    toast.success('Password copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Success state showing temp password
  if (tempPassword) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="User Created" size="sm">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10">
            <CheckCircle className="h-6 w-6 text-teal" />
          </div>
          <p className="mb-4 text-sm text-muted">
            A temporary password has been generated. Share it securely with the user.
          </p>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-4 py-3">
            <code className="flex-1 text-sm font-mono text-text">{tempPassword}</code>
            <button
              onClick={copyPassword}
              className="rounded-md p-1.5 text-muted hover:text-text"
              title="Copy"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-teal" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <Button variant="primary" fullWidth onClick={handleClose}>
            Done
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Edit User' : 'Add User'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. Jane Doe"
          error={errors.fullName?.message}
          {...register('fullName', { required: 'Full name is required' })}
        />

        <Input
          label="Email"
          type="email"
          placeholder="e.g. jane@example.com"
          disabled={isEditing}
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
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
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
