import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { authApi } from '../../api/auth.api'

interface ForgotForm {
  email: string
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>()

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const sendReset = useCallback(
    async (email: string) => {
      setIsSubmitting(true)
      try {
        await authApi.forgotPassword(email)
        setSubmittedEmail(email)
        setStep(2)
        setResendCooldown(60)
      } catch {
        toast.error('Something went wrong. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    []
  )

  const onSubmit = (data: ForgotForm) => sendReset(data.email)

  const handleResend = () => {
    if (resendCooldown > 0) return
    sendReset(submittedEmail)
  }

  const maskedEmail = submittedEmail
    ? submittedEmail.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-surface p-8 shadow-card">
          {step === 1 ? (
            <>
              <h1 className="mb-1 text-2xl font-bold text-text">Forgot password?</h1>
              <p className="mb-6 text-sm text-muted">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register('email', { required: 'Email is required' })}
                />
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isSubmitting}
                  className="mt-6"
                >
                  Send Reset Link
                </Button>
              </form>

              <Link
                to="/login"
                className="mt-4 flex items-center justify-center gap-1 text-sm text-muted hover:text-text"
              >
                <ArrowLeft className="h-4 w-4" /> Back to login
              </Link>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
                <CheckCircle className="h-8 w-8 text-teal" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-text">Check your email</h1>
              <p className="mb-1 text-sm text-muted">
                We've sent a password reset link to
              </p>
              <p className="mb-6 text-sm font-medium text-text">{maskedEmail}</p>

              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-sm font-medium text-secondary hover:underline disabled:text-muted disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend email'}
              </button>

              <div className="mt-6">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1 text-sm text-muted hover:text-text"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
