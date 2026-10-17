import { queryOptions } from '@tanstack/react-query'
import { nftKeys } from '@/features/catalog/api/catalog-queries'
import { fetchNftDetail, fetchRelatedNfts } from './nft-detail-api'

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => fetchNftDetail(id, signal),
  })
}

export function relatedNftsQueryOptions(id: string) {
  return queryOptions({
    queryKey: [...nftKeys.detail(id), 'related'] as const,
    queryFn: ({ signal }) => fetchRelatedNfts(id, signal),
    staleTime: 5 * 60_000,
  })
}
