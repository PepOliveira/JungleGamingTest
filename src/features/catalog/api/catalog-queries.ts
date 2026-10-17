import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { NftListQuery } from '@/contracts/nft'
import { fetchFeaturedNfts, fetchNftList } from './catalog-api'

export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (query: NftListQuery) => [...nftKeys.lists(), query] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
  detail: (id: string) => [...nftKeys.all, 'detail', id] as const,
}

export function nftListQueryOptions(query: NftListQuery) {
  return queryOptions({
    queryKey: nftKeys.list(query),
    queryFn: ({ signal }) => fetchNftList(query, signal),
    placeholderData: keepPreviousData,
  })
}

export function featuredNftsQueryOptions() {
  return queryOptions({
    queryKey: nftKeys.featured(),
    queryFn: ({ signal }) => fetchFeaturedNfts(signal),
    staleTime: 5 * 60_000,
  })
}
