import { queryOptions } from '@tanstack/react-query'
import { fetchSession } from './auth-api'

export const sessionKey = ['session'] as const

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionKey,
    queryFn: ({ signal }) => fetchSession(signal),
    staleTime: 60_000,
    retry: false,
  })
}
