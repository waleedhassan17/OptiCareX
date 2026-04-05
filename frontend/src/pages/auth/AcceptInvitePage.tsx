import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { User as UserIcon, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../stores/authStore'
import { UserRole } from '../../types'
import axiosInstance from '../../api/axiosInstance'

interface AcceptForm {
  fullName: string
  password: string
  confirmPassword: string
}

const ROLE_ROUTES: Record<string, string> = {
  [UserRole.SuperAdmin]: '/super-admin',
  [UserRole.OrgAdmin]: '/admin',
  [UserRole.Technician]: '/technician',
  [UserRole.Clinician]: '/clinician',
  [UserRole.Coordinator]: '/coordinator',
  [UserRole.Patient]: '/portal',
}

function getStrength(pw: string): { label: string; score: number; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) score++

  if (score <= 1) return { label: 'Weak', score: 1, color: 'bg-danger' }
  if (score === 2) return { label: 'Fair', score: 2, color: 'bg-amber' }
  if (score === 3) return { label: 'Strong', score: 3, color: 'bg-secondary' }
  return { label: 'Excellent', score: 4, color: 'bg-teal' }
}

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const token = searchParams.get('token') || ''
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AcceptForm>()

  const password = watch('password', '')
  const strength = password ? getStrength(password) : null

  const onSubmit = async (data: AcceptForm) => {
    if (!token) {
      toast.error('Missing invitation token.')
      return
    }
    setIsSubmitting(true)
    try {
      const resp = await authApi.acceptInvitation(token, data.fullName, data.password)
      // Store tokens and set auth state
      localStorage.setItem('access_token', resp.access)
      localStorage.setItem('refresh_token', resp.refresh)
      localStorage.setItem('user', JSON.stringify(resp.user))
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${resp.access}`
      setUser(resp.user)
      useAuthStore.setState({ accessToken: resp.access, isAuthenticated: true })
      toast.success('Welcome to OptiCareX!')
      const route = ROLE_ROUTES[resp.user.role] || '/admin'
      navigate(route, { replace: true })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to accept invitation. The link may be invalid or expired.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-surface p-8 shadow-card">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text">Join OptiCareX</h1>
            <p className="mt-1 text-sm text-muted">
              Complete your account to get started
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Dr. Jane Smith"
                leftIcon={<UserIcon className="h-4 w-4" />}
                error={errors.fullName?.message}
                {...register('fullName', { required: 'Full name is required' })}
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted hover:text-text"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
                      message: 'Needs uppercase, number, and special character',
                    },
                  })}
                />
                {strength && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={clsx(
                            'h-1.5 flex-1 rounded-full transition-colors',
                            level <= strength.score ? strength.color : 'bg-border'
                          )}
                        />
                      ))}
                    </div>
                    <p className={clsx('mt-1 text-xs', strength.score <= 1 ? 'text-danger' : 'text-muted')}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === password || 'Passwords do not match',
                })}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
              className="mt-6"
            >
              Create Account & Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            By continuing, you agree to the OptiCareX Terms of Service.
          </p>
        </div>
      </div>
    </div>
  )
}
