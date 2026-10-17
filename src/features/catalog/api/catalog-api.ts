import { endpoints } from '@/contracts/endpoints'
import { featuredNftsResponseSchema, nftListResponseSchema } from '@/contracts/nft'
import type { NftListQuery } from '@/contracts/nft'
import { apiRequest } from '@/shared/api/request'

export function fetchNftList(query: NftListQuery, signal?: AbortSignal) {
  return apiRequest({ url: endpoints.nfts.list, params: query, signal }, nftListResponseSchema)
}

export function fetchFeaturedNfts(signal?: AbortSignal) {
  return apiRequest({ url: endpoints.nfts.featured, signal }, featuredNftsResponseSchema)
}
