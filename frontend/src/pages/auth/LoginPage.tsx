import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, Eye, EyeOff, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { useAuthStore } from '../../stores/authStore'
import { UserRole } from '../../types'

interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

const ROLE_ROUTES: Record<string, string> = {
  [UserRole.SuperAdmin]: '/super-admin',
  [UserRole.OrgAdmin]: '/admin',
  [UserRole.Technician]: '/technician',
  [UserRole.Clinician]: '/clinician',
  [UserRole.Coordinator]: '/coordinator',
  [UserRole.Patient]: '/portal',
}

const DEMO_ACCOUNTS = [
  { label: 'SuperAdmin', email: 'superadmin@opticarex.io', password: 'Admin123!' },
  { label: 'OrgAdmin', email: 'orgadmin@visioncare.com', password: 'Admin123!' },
  { label: 'Technician', email: 'tech@visioncare.com', password: 'Admin123!' },
  { label: 'Clinician', email: 'clinician@visioncare.com', password: 'Admin123!' },
  { label: 'Coordinator', email: 'coordinator@visioncare.com', password: 'Admin123!' },
]

const FEATURES = [
  'AI-powered retinal screening & diagnostics',
  'Multi-site telehealth care coordination',
  'Real-time analytics & audit compliance',
]

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shake, setShake] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    try {
      await login(data.email, data.password)
      const user = useAuthStore.getState().user
      const route = user ? ROLE_ROUTES[user.role] || '/admin' : '/admin'
      navigate(route, { replace: true })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Login failed. Please try again.'
      toast.error(message)
      setShake(true)
      setTimeout(() => setShake(false), 600)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillDemo = (index: number) => {
    const account = DEMO_ACCOUNTS[index]
    setValue('email', account.email)
    setValue('password', account.password)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-center bg-primary px-12 text-white">
        <div className="max-w-md">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">OptiCareX</span>
          </div>
          <p className="mb-10 text-lg text-white/70">Clear sight. Better outcomes.</p>

          <ul className="space-y-4">
            {FEATURES.map((feat) => (
              <li key={feat} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
                <span className="text-white/90">{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full items-center justify-center bg-bg px-6 lg:w-[60%]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-primary">OptiCareX</span>
          </div>

          <div className="rounded-xl bg-surface p-8 shadow-card">
            <h1 className="mb-1 text-2xl font-bold text-text">Welcome back</h1>
            <p className="mb-6 text-sm text-muted">Sign in to your account to continue</p>

            <form
              ref={formRef}
              onSubmit={handleSubmit(onSubmit)}
              className={clsx(shake && 'animate-[shake_0.5s_ease-in-out]')}
            >
              <div className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register('email', { required: 'Email is required' })}
                />

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-sm font-medium text-text">Password</label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-secondary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
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
                    {...register('password', { required: 'Password is required' })}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    {...register('rememberMe')}
                  />
                  Remember me
                </label>
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isSubmitting}
                className="mt-6"
              >
                Sign In
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted">
              OptiCareX v1.0 — For clinical use only
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-4 rounded-xl border border-border bg-surface shadow-card">
            <button
              onClick={() => setDemoOpen(!demoOpen)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted hover:text-text"
            >
              <span>Demo Accounts</span>
              {demoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {demoOpen && (
              <div className="border-t border-border px-4 pb-3 pt-2">
                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((acct, i) => (
                    <div
                      key={acct.label}
                      className="flex items-center justify-between rounded-md bg-bg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-text">{acct.label}</span>
                        <span className="block truncate text-xs text-muted">{acct.email}</span>
                      </div>
                      <button
                        onClick={() => fillDemo(i)}
                        className="ml-3 flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-text"
                      >
                        {copiedIndex === i ? (
                          <>
                            <Check className="h-3 w-3 text-teal" /> Filled
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Use
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
