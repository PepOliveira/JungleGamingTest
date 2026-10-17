import { endpoints } from '@/contracts/endpoints'
import { nftDetailSchema, relatedNftsResponseSchema } from '@/contracts/nft'
import { apiRequest } from '@/shared/api/request'

export function fetchNftDetail(id: string, signal?: AbortSignal) {
  return apiRequest({ url: endpoints.nfts.detail(id), signal }, nftDetailSchema)
}

export function fetchRelatedNfts(id: string, signal?: AbortSignal) {
  return apiRequest({ url: endpoints.nfts.related(id), signal }, relatedNftsResponseSchema)
}
