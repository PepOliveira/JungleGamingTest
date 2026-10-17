import { QueryClient } from '@tanstack/react-query'
import { toApiError } from '@/shared/api/api-error'

const MAX_QUERY_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) =>
        toApiError(error).retryable && failureCount < MAX_QUERY_RETRIES,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      retry: false,
    },
  },
})
