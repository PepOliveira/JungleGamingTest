import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { RealtimeBridge } from '@/features/realtime/realtime-bridge'
import { queryClient } from './query-client'
import { router } from './router'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeBridge />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
