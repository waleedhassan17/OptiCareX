import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import Button from '../components/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/10">
          <FileQuestion className="h-8 w-8 text-muted" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-text">404</h1>
        <p className="mb-1 text-lg font-medium text-text">Page Not Found</p>
        <p className="mb-6 text-sm text-muted">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button variant="primary">Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}
