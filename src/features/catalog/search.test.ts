import { describe, expect, it } from 'vitest'
import { hasActiveFilters, parseCatalogSearch, toListQuery } from './search'

describe('parseCatalogSearch', () => {
  it('fills defaults for an empty URL', () => {
    expect(parseCatalogSearch({})).toEqual({
      q: undefined,
      collections: [],
      networks: [],
      priceMin: undefined,
      priceMax: undefined,
      tab: 'all',
      sort: 'recent',
      page: 1,
    })
  })

  it('falls back to defaults for invalid values instead of throwing', () => {
    const search = parseCatalogSearch({
      sort: 'invalid',
      tab: 42,
      page: -3,
      collections: ['nope'],
      priceMin: 'abc',
    })
    expect(search).toMatchObject({
      sort: 'recent',
      tab: 'all',
      page: 1,
      collections: [],
      priceMin: undefined,
    })
  })

  it('keeps valid values', () => {
    const search = parseCatalogSearch({
      q: ' ape ',
      collections: ['musica', 'jogos'],
      networks: ['solana'],
      priceMin: '0.5',
      priceMax: '3',
      tab: 'trending',
      sort: 'price_desc',
      page: 3,
    })
    expect(search).toEqual({
      q: 'ape',
      collections: ['musica', 'jogos'],
      networks: ['solana'],
      priceMin: '0.5',
      priceMax: '3',
      tab: 'trending',
      sort: 'price_desc',
      page: 3,
    })
  })

  it('treats a blank search term as absent', () => {
    expect(parseCatalogSearch({ q: '   ' }).q).toBeUndefined()
  })
})

describe('toListQuery', () => {
  it('adds the fixed page size', () => {
    expect(toListQuery(parseCatalogSearch({ page: 2 }))).toMatchObject({ page: 2, pageSize: 9 })
  })
})

describe('hasActiveFilters', () => {
  it('ignores sorting and pagination', () => {
    expect(hasActiveFilters(parseCatalogSearch({ sort: 'price_asc', page: 4 }))).toBe(false)
  })

  it('detects any filter', () => {
    expect(hasActiveFilters(parseCatalogSearch({ collections: ['musica'] }))).toBe(true)
    expect(hasActiveFilters(parseCatalogSearch({ q: 'ape' }))).toBe(true)
    expect(hasActiveFilters(parseCatalogSearch({ tab: 'new' }))).toBe(true)
  })
})
