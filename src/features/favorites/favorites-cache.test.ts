import { describe, expect, it } from 'vitest'
import type { NftSummary } from '@/contracts/nft'
import { applyFavoriteChange, pickSummary } from './favorites-cache'

const nft: NftSummary = {
  id: 'nft_1',
  name: 'Emerald Ape #042',
  image: { url: '/a-640.webp', alt: 'alt' },
  price: '1.19',
  originalPrice: null,
  rarity: 'common',
  collection: 'musica',
  network: 'ethereum',
  available: 10,
  version: 1,
}
const other: NftSummary = { ...nft, id: 'nft_2', name: 'Other' }

describe('applyFavoriteChange', () => {
  it('adds a favorite to an empty cache', () => {
    expect(applyFavoriteChange(undefined, nft, true).items.map((item) => item.id)).toEqual([
      'nft_1',
    ])
  })

  it('appends without duplicating', () => {
    const once = applyFavoriteChange({ items: [other] }, nft, true)
    const twice = applyFavoriteChange(once, nft, true)
    expect(twice.items.map((item) => item.id)).toEqual(['nft_2', 'nft_1'])
  })

  it('removes a favorite and ignores missing ones', () => {
    const removed = applyFavoriteChange({ items: [nft, other] }, nft, false)
    expect(removed.items.map((item) => item.id)).toEqual(['nft_2'])
    expect(applyFavoriteChange(removed, nft, false).items).toHaveLength(1)
  })

  it('does not mutate the previous value', () => {
    const previous = { items: [nft] }
    applyFavoriteChange(previous, other, true)
    expect(previous.items).toHaveLength(1)
  })
})

describe('pickSummary', () => {
  it('drops fields that are not part of the summary', () => {
    const detail = { ...nft, summary: 'long', extra: 1 } as NftSummary
    expect(Object.keys(pickSummary(detail)).sort()).toEqual(Object.keys(nft).sort())
  })
})
