import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { authApi } from '../../api/auth.api'

interface ResetForm {
  newPassword: string
  confirmPassword: string
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

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [redirectCount, setRedirectCount] = useState(3)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetForm>()

  const password = watch('newPassword', '')
  const strength = password ? getStrength(password) : null

  useEffect(() => {
    if (!success) return
    if (redirectCount <= 0) {
      navigate('/login', { replace: true })
      return
    }
    const t = setTimeout(() => setRedirectCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [success, redirectCount, navigate])

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      toast.error('Missing reset token.')
      return
    }
    setIsSubmitting(true)
    try {
      await authApi.resetPassword(token, data.newPassword)
      setSuccess(true)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to reset password. The link may have expired.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="w-full max-w-md rounded-xl bg-surface p-8 shadow-card text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
            <CheckCircle className="h-8 w-8 text-teal" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-text">Password reset!</h1>
          <p className="text-sm text-muted">
            Redirecting to login in {redirectCount}s…
          </p>
          <Link
            to="/login"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
          >
            Go to login now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-surface p-8 shadow-card">
          <h1 className="mb-1 text-2xl font-bold text-text">Set new password</h1>
          <p className="mb-6 text-sm text-muted">Choose a strong password for your account.</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <Input
                  label="New Password"
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
                  error={errors.newPassword?.message}
                  {...register('newPassword', {
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
              Reset Password
            </Button>
          </form>

          <Link
            to="/login"
            className="mt-4 flex items-center justify-center gap-1 text-sm text-muted hover:text-text"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
