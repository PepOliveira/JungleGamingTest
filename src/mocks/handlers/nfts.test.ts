import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { endpoints } from '@/contracts/endpoints'
import { featuredNftsResponseSchema, nftDetailSchema, nftListResponseSchema } from '@/contracts/nft'
import { isApiError } from '@/shared/api/api-error'
import { apiRequest } from '@/shared/api/request'
import { resetDb } from '../db/store'
import { setScenario } from '../scenarios'
import { server } from '../server'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  setScenario('instant')
  resetDb()
})

function listNfts(params: Record<string, string | string[]> = {}) {
  return apiRequest({ url: endpoints.nfts.list, params }, nftListResponseSchema)
}

describe('GET /nfts', () => {
  it('returns the first page matching the contract', async () => {
    const response = await listNfts()
    expect(response.items).toHaveLength(9)
    expect(response.pagination).toEqual({ page: 1, pageSize: 9, total: 48, totalPages: 6 })
    expect(response.items[0]?.id).toBe('nft_001')
  })

  it('combines search, filters and pagination in the response', async () => {
    const response = await listNfts({
      collections: ['musica', 'jogos'],
      networks: ['ethereum', 'solana'],
      sort: 'price_asc',
    })
    expect(response.pagination.total).toBeGreaterThan(0)
    for (const item of response.items) {
      expect(['musica', 'jogos']).toContain(item.collection)
      expect(['ethereum', 'solana']).toContain(item.network)
    }
  })

  it('returns an empty list for a search without matches', async () => {
    const response = await listNfts({ q: 'inexistente-xyz' })
    expect(response.items).toEqual([])
    expect(response.pagination).toMatchObject({ total: 0, totalPages: 0 })
  })

  it('reflects the requested page and page size', async () => {
    const response = await listNfts({ page: '2', pageSize: '12' })
    expect(response.pagination).toMatchObject({ page: 2, pageSize: 12, totalPages: 4 })
    expect(response.items[0]?.id).toBe('nft_013')
  })

  it('rejects invalid query parameters with field errors', async () => {
    const error = await listNfts({ sort: 'invalido', page: '0' }).catch((reason: unknown) => reason)
    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) {
      expect(error.status).toBe(422)
      expect(error.kind).toBe('validation')
      expect(Object.keys(error.fieldErrors)).toEqual(expect.arrayContaining(['sort', 'page']))
    }
  })
})

describe('GET /nfts/featured', () => {
  it('returns the highlighted NFTs', async () => {
    const response = await apiRequest({ url: endpoints.nfts.featured }, featuredNftsResponseSchema)
    expect(response.items).toHaveLength(4)
    expect(response.items[0]?.rarity).toBe('rare')
  })
})

describe('GET /nfts/:id', () => {
  it('returns the NFT detail', async () => {
    const detail = await apiRequest({ url: endpoints.nfts.detail('nft_003') }, nftDetailSchema)
    expect(detail.name).toBe('Neon Vessel #552')
    expect(detail.editions.length).toBeGreaterThan(0)
    expect(detail.gallery.length).toBeGreaterThan(0)
  })

  it('responds 404 for an unknown NFT', async () => {
    const error = await apiRequest(
      { url: endpoints.nfts.detail('nft_999') },
      nftDetailSchema,
    ).catch((reason: unknown) => reason)
    expect(isApiError(error) && error.kind).toBe('not_found')
    expect(isApiError(error) && error.code).toBe('not_found')
  })
})
