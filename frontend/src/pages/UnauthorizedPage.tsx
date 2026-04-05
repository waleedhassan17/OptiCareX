import { useNavigate } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import Button from '../components/Button'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
          <ShieldX className="h-8 w-8 text-danger" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-text">403</h1>
        <p className="mb-1 text-lg font-medium text-text">Access Denied</p>
        <p className="mb-6 text-sm text-muted">
          You don't have permission to view this page.
        </p>
        <Button variant="primary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  )
}
