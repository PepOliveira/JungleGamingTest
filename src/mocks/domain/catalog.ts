import type { EthAmount } from '@/contracts/common'
import { collectionSlugSchema } from '@/contracts/nft'
import type { NftDetail, NftFacets, NftListQuery, NftSummary } from '@/contracts/nft'
import { networkSchema } from '@/contracts/common'
import { ethCompare } from '@/shared/lib/eth'
import type { NftRecord } from '../db/types'
import { collectionLabels, networkLabels } from '../fixtures/labels'
import { normalizeText } from '../utils/text'

type OmittedFilter = 'collections' | 'networks'

function matchesTerm(nft: NftRecord, term: string) {
  const haystack = normalizeText(
    [
      nft.name,
      nft.creator.name,
      nft.collectionName,
      collectionLabels[nft.collection],
      networkLabels[nft.network],
      ...nft.attributes,
    ].join(' '),
  )
  return haystack.includes(term)
}

export function filterNfts(
  nfts: readonly NftRecord[],
  query: NftListQuery,
  omit?: OmittedFilter,
): NftRecord[] {
  const term = query.q ? normalizeText(query.q) : null

  return nfts.filter((nft) => {
    if (term && !matchesTerm(nft, term)) return false
    if (query.tab === 'new' && !nft.isNew) return false
    if (query.tab === 'trending' && !nft.isTrending) return false
    if (omit !== 'collections' && query.collections.length > 0) {
      if (!query.collections.includes(nft.collection)) return false
    }
    if (omit !== 'networks' && query.networks.length > 0) {
      if (!query.networks.includes(nft.network)) return false
    }
    if (query.priceMin && ethCompare(nft.price, query.priceMin) < 0) return false
    if (query.priceMax && ethCompare(nft.price, query.priceMax) > 0) return false
    return true
  })
}

export function sortNfts(nfts: readonly NftRecord[], sort: NftListQuery['sort']): NftRecord[] {
  const compare: Record<NftListQuery['sort'], (a: NftRecord, b: NftRecord) => number> = {
    recent: (a, b) => b.listedAt.localeCompare(a.listedAt),
    price_asc: (a, b) => ethCompare(a.price, b.price),
    price_desc: (a, b) => ethCompare(b.price, a.price),
    name_asc: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
  }

  return [...nfts].sort((a, b) => compare[sort](a, b) || a.id.localeCompare(b.id))
}

export function paginate<TItem>(items: readonly TItem[], page: number, pageSize: number) {
  const total = items.length
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

function countBy(
  nfts: readonly NftRecord[],
  keys: readonly string[],
  pick: (nft: NftRecord) => string,
) {
  const counts: Record<string, number> = Object.fromEntries(keys.map((key) => [key, 0]))
  for (const nft of nfts) {
    const key = pick(nft)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export function buildFacets(nfts: readonly NftRecord[], query: NftListQuery): NftFacets {
  const prices = nfts.map((nft) => nft.price)
  const [first] = prices
  const bounds = prices.reduce<{ min: EthAmount; max: EthAmount }>(
    (acc, price) => ({
      min: ethCompare(price, acc.min) < 0 ? price : acc.min,
      max: ethCompare(price, acc.max) > 0 ? price : acc.max,
    }),
    { min: first ?? '0', max: first ?? '0' },
  )

  return {
    collections: countBy(
      filterNfts(nfts, query, 'collections'),
      collectionSlugSchema.options,
      (nft) => nft.collection,
    ),
    networks: countBy(
      filterNfts(nfts, query, 'networks'),
      networkSchema.options,
      (nft) => nft.network,
    ),
    price: bounds,
  }
}

export function toSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    image: nft.image,
    price: nft.price,
    originalPrice: nft.originalPrice,
    rarity: nft.rarity,
    collection: nft.collection,
    network: nft.network,
    available: nft.available,
    version: nft.version,
  }
}

export function toDetail(nft: NftRecord): NftDetail {
  return {
    ...toSummary(nft),
    tokenId: nft.tokenId,
    collectionName: nft.collectionName,
    summary: nft.summary,
    description: nft.description,
    attributes: nft.attributes,
    creator: nft.creator,
    gallery: nft.gallery,
    editions: nft.editions,
    defaultEditionId: nft.defaultEditionId,
    rating: nft.rating,
    contractAddress: nft.contractAddress,
    royaltyPercent: nft.royaltyPercent,
  }
}

export function relatedNfts(
  nfts: readonly NftRecord[],
  nft: NftRecord,
  limit: number,
): NftRecord[] {
  const score = (candidate: NftRecord) =>
    (candidate.collectionName === nft.collectionName ? 2 : 0) +
    (candidate.collection === nft.collection ? 1 : 0)

  return nfts
    .filter((candidate) => candidate.id !== nft.id)
    .sort((a, b) => score(b) - score(a) || b.popularity - a.popularity || a.id.localeCompare(b.id))
    .slice(0, limit)
}
