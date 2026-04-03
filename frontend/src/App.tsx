import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-bg font-sans">
          <div className="flex items-center justify-center h-screen">
            <h1 className="text-2xl font-semibold text-text">
              OptiCareX
            </h1>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
