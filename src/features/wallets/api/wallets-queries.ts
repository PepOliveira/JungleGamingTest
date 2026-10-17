import { queryOptions } from '@tanstack/react-query'
import { fetchWallets } from './wallets-api'

export const walletsKey = (userId: string) => ['wallets', userId] as const

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: walletsKey(userId),
    queryFn: ({ signal }) => fetchWallets(signal),
    staleTime: 60_000,
  })
}
