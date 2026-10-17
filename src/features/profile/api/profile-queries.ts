import { queryOptions } from '@tanstack/react-query'
import { fetchProfile } from './profile-api'

export const profileKey = (userId: string) => ['profile', userId] as const

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: profileKey(userId),
    queryFn: ({ signal }) => fetchProfile(signal),
    staleTime: 60_000,
  })
}
