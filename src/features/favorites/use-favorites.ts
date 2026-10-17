import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { FavoritesResponse } from '@/contracts/favorites'
import type { NftSummary } from '@/contracts/nft'
import { useSession } from '@/features/auth/use-session'
import { announce } from '@/shared/lib/announcer'
import { addFavorite, removeFavorite } from './api/favorites-api'
import { favoritesKey, favoritesQueryOptions } from './api/favorites-queries'
import { applyFavoriteChange } from './favorites-cache'

export function useFavoriteIds() {
  const session = useSession()
  const userId = session.user?.id ?? null
  const query = useQuery({
    ...favoritesQueryOptions(userId ?? 'anonymous'),
    enabled: userId !== null,
  })

  const ids = useMemo(() => new Set((query.data?.items ?? []).map((item) => item.id)), [query.data])

  return { ids, userId, isReady: query.isSuccess }
}

type ToggleVariables = {
  nft: NftSummary
  favorite: boolean
}

export function useToggleFavorite(userId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    scope: { id: 'favorites' },
    mutationFn: ({ nft, favorite }: ToggleVariables) =>
      favorite ? addFavorite(nft.id) : removeFavorite(nft.id),
    onMutate: async ({ nft, favorite }) => {
      if (!userId) return { previous: undefined }
      const key = favoritesKey(userId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      queryClient.setQueryData<FavoritesResponse>(key, (current) =>
        applyFavoriteChange(current, nft, favorite),
      )
      return { previous }
    },
    onSuccess: (_data, { nft, favorite }) => {
      announce(
        favorite ? `${nft.name} adicionado aos favoritos` : `${nft.name} removido dos favoritos`,
      )
    },
    onError: (_error, { nft, favorite }, context) => {
      if (userId && context) {
        queryClient.setQueryData(favoritesKey(userId), context.previous)
      }
      announce(
        `Não foi possível ${favorite ? 'favoritar' : 'remover dos favoritos'} ${nft.name}. Tente novamente.`,
        { visible: true, tone: 'error' },
      )
    },
    onSettled: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: favoritesKey(userId) })
      }
    },
  })
}
