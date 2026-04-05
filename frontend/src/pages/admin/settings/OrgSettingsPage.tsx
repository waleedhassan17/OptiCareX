import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Upload } from 'lucide-react'

import { orgApi } from '../../../api/tenants.api'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Textarea from '../../../components/Textarea'
import Select from '../../../components/Select'
import PageHeader from '../../../components/PageHeader'
import Card from '../../../components/Card'
import LoadingSpinner from '../../../components/LoadingSpinner'

const TIMEZONES = [
  'UTC', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific',
  'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Australia/Sydney', 'America/Toronto', 'America/Chicago',
].map((tz) => ({ value: tz, label: tz }))

interface OrgForm {
  name: string
  logoUrl: string
  contactEmail: string
  contactPhone: string
  address: string
  timezone: string
}

export default function OrgSettingsPage() {
  const queryClient = useQueryClient()

  const { data: org, isLoading } = useQuery({
    queryKey: ['org-settings'],
    queryFn: orgApi.getSettings,
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<OrgForm>()

  useEffect(() => {
    if (org) {
      reset({
        name: org.name ?? '',
        logoUrl: org.logoUrl ?? '',
        contactEmail: org.contactEmail ?? '',
        contactPhone: org.contactPhone ?? '',
        address: org.address ?? '',
        timezone: org.timezone ?? 'UTC',
      })
    }
  }, [org, reset])

  const mutation = useMutation({
    mutationFn: (data: OrgForm) => orgApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] })
      toast.success('Organization settings saved.')
    },
    onError: () => toast.error('Failed to save settings.'),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Organization"
        subtitle="Manage your organization profile and contact information."
        breadcrumbs={[
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Organization' },
        ]}
      />

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left column — Logo + basic info */}
          <Card>
            {/* Logo placeholder */}
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-text">Logo</label>
              <div className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-gray-50 transition-colors hover:border-primary/40 hover:bg-gray-100">
                {org?.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt="Org logo"
                    className="h-full w-full rounded-lg object-contain p-2"
                  />
                ) : (
                  <div className="text-center text-muted">
                    <Upload className="mx-auto h-6 w-6 mb-1" />
                    <span className="text-xs">Upload</span>
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted">PNG, JPG up to 2 MB</p>
            </div>

            <div className="space-y-4">
              <Input
                label="Organization Name"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message}
              />
              <Input
                label="Logo URL"
                placeholder="https://..."
                {...register('logoUrl')}
              />
              <Textarea
                label="Address"
                rows={3}
                {...register('address')}
              />
            </div>
          </Card>

          {/* Right column — Timezone + contact */}
          <Card>
            <div className="space-y-4">
              <Select
                label="Timezone"
                options={TIMEZONES}
                {...register('timezone')}
              />
              <Input
                label="Contact Email"
                type="email"
                {...register('contactEmail')}
              />
              <Input
                label="Contact Phone"
                {...register('contactPhone')}
              />
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" isLoading={mutation.isPending} disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
