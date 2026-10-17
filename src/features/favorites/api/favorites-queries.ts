import { queryOptions } from '@tanstack/react-query'
import { fetchFavorites } from './favorites-api'

export const favoritesKey = (userId: string) => ['favorites', userId] as const

export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: favoritesKey(userId),
    queryFn: ({ signal }) => fetchFavorites(signal),
    staleTime: 60_000,
  })
}
