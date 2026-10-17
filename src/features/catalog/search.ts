import { z } from 'zod'
import { ethAmountSchema, networkSchema } from '@/contracts/common'
import type { EthAmount, Network } from '@/contracts/common'
import { collectionSlugSchema, nftSortSchema, nftTabSchema } from '@/contracts/nft'
import type { CollectionSlug, NftListQuery, NftSort, NftTab } from '@/contracts/nft'

export const CATALOG_PAGE_SIZE = 9

export const catalogSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .transform((value) => value || undefined)
    .optional()
    .catch(undefined),
  collections: z.array(collectionSlugSchema).optional().catch(undefined),
  networks: z.array(networkSchema).optional().catch(undefined),
  priceMin: ethAmountSchema.optional().catch(undefined),
  priceMax: ethAmountSchema.optional().catch(undefined),
  tab: nftTabSchema.optional().catch(undefined),
  sort: nftSortSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
})
export type CatalogRouteSearch = z.output<typeof catalogSearchSchema>

export type CatalogSearch = {
  q: string | undefined
  collections: CollectionSlug[]
  networks: Network[]
  priceMin: EthAmount | undefined
  priceMax: EthAmount | undefined
  tab: NftTab
  sort: NftSort
  page: number
}

export const catalogSearchDefaults: CatalogRouteSearch = {
  collections: [],
  networks: [],
  tab: 'all',
  sort: 'recent',
  page: 1,
}

export function normalizeCatalogSearch(raw: CatalogRouteSearch): CatalogSearch {
  return {
    q: raw.q,
    collections: raw.collections ?? [],
    networks: raw.networks ?? [],
    priceMin: raw.priceMin,
    priceMax: raw.priceMax,
    tab: raw.tab ?? 'all',
    sort: raw.sort ?? 'recent',
    page: raw.page ?? 1,
  }
}

export function parseCatalogSearch(raw: Record<string, unknown>): CatalogSearch {
  return normalizeCatalogSearch(catalogSearchSchema.parse(raw))
}

export function toListQuery(search: CatalogSearch): NftListQuery {
  return {
    q: search.q,
    collections: search.collections,
    networks: search.networks,
    priceMin: search.priceMin,
    priceMax: search.priceMax,
    tab: search.tab,
    sort: search.sort,
    page: search.page,
    pageSize: CATALOG_PAGE_SIZE,
  }
}

export function hasActiveFilters(search: CatalogSearch) {
  return (
    Boolean(search.q) ||
    search.collections.length > 0 ||
    search.networks.length > 0 ||
    search.priceMin !== undefined ||
    search.priceMax !== undefined ||
    search.tab !== 'all'
  )
}

export function clearedFilters(sort: CatalogSearch['sort']): Partial<CatalogSearch> {
  return {
    q: undefined,
    collections: [],
    networks: [],
    priceMin: undefined,
    priceMax: undefined,
    tab: 'all',
    sort,
  }
}
