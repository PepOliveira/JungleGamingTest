import { beforeAll, describe, expect, it } from 'vitest'
import { nftListQuerySchema } from '@/contracts/nft'
import type { NftListQueryInput } from '@/contracts/nft'
import { ethCompare } from '@/shared/lib/eth'
import type { NftRecord } from '../db/types'
import { createCatalog } from '../fixtures/catalog'
import { buildFacets, filterNfts, paginate, sortNfts } from './catalog'

function query(input: NftListQueryInput = {}) {
  return nftListQuerySchema.parse(input)
}

let catalog: NftRecord[]

beforeAll(() => {
  catalog = createCatalog()
})

describe('catalog fixtures', () => {
  it('is deterministic', () => {
    expect(createCatalog()).toEqual(createCatalog())
  })

  it('has enough variety to exercise filters and pagination', () => {
    expect(catalog).toHaveLength(48)
    expect(new Set(catalog.map((nft) => nft.collection)).size).toBe(9)
    expect(new Set(catalog.map((nft) => nft.network)).size).toBe(3)
    expect(new Set(catalog.map((nft) => nft.id)).size).toBe(48)
    expect(new Set(catalog.map((nft) => nft.name)).size).toBe(48)
    expect(catalog.some((nft) => nft.rarity === 'rare')).toBe(true)
    expect(catalog.some((nft) => nft.originalPrice !== null)).toBe(true)
    expect(catalog.some((nft) => nft.available === 0)).toBe(true)
  })

  it('spans the price range shown in the design', () => {
    const { price } = buildFacets(catalog, query())
    expect(price).toEqual({ min: '0.02', max: '12.30' })
  })

  it('keeps summary price equal to the first edition price', () => {
    for (const nft of catalog) {
      expect(nft.price).toBe(nft.editions[0]?.price)
    }
  })
})

describe('filterNfts', () => {
  it('combines filters', () => {
    const result = filterNfts(
      catalog,
      query({ collections: ['musica'], networks: ['ethereum'], priceMax: '1.50' }),
    )
    expect(result.length).toBeGreaterThan(0)
    for (const nft of result) {
      expect(nft.collection).toBe('musica')
      expect(nft.network).toBe('ethereum')
      expect(ethCompare(nft.price, '1.50')).toBeLessThanOrEqual(0)
    }
  })

  it('searches ignoring case and accents', () => {
    const result = filterNfts(catalog, query({ q: 'MUSICA' }))
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((nft) => nft.tags.includes('Música'))).toBe(true)
  })

  it('applies the tabs', () => {
    expect(filterNfts(catalog, query({ tab: 'new' }))).toHaveLength(12)
    expect(filterNfts(catalog, query({ tab: 'trending' }))).toHaveLength(16)
  })
})

describe('sortNfts', () => {
  it('sorts by price numerically', () => {
    const asc = sortNfts(catalog, 'price_asc').map((nft) => nft.price)
    for (let index = 1; index < asc.length; index += 1) {
      expect(ethCompare(asc[index - 1] ?? '0', asc[index] ?? '0')).toBeLessThanOrEqual(0)
    }
    expect(asc[0]).toBe('0.02')
    expect(asc.at(-1)).toBe('12.30')
  })

  it('sorts recent first by default order', () => {
    const [first] = sortNfts(catalog, 'recent')
    expect(first?.id).toBe('nft_001')
  })
})

describe('paginate', () => {
  it('slices pages and computes totals', () => {
    const page = paginate(catalog, 2, 9)
    expect(page.items).toHaveLength(9)
    expect(page.items[0]).toBe(catalog[9])
    expect(page.pagination).toEqual({ page: 2, pageSize: 9, total: 48, totalPages: 6 })
  })

  it('returns an empty page beyond the last one', () => {
    expect(paginate(catalog, 99, 9).items).toEqual([])
  })
})

describe('buildFacets', () => {
  it('counts collections ignoring the collection filter itself', () => {
    const facets = buildFacets(catalog, query({ collections: ['musica'] }))
    const total = Object.values(facets.collections).reduce((sum, count) => sum + count, 0)
    expect(total).toBe(48)
    expect(Object.keys(facets.collections)).toHaveLength(9)
  })

  it('narrows collection counts when other filters apply', () => {
    const facets = buildFacets(catalog, query({ networks: ['solana'] }))
    const total = Object.values(facets.collections).reduce((sum, count) => sum + count, 0)
    expect(total).toBe(catalog.filter((nft) => nft.network === 'solana').length)
  })
})
