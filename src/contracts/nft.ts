import { z } from 'zod'
import {
  ethAmountSchema,
  idSchema,
  imageSchema,
  networkSchema,
  paginated,
  versionSchema,
} from './common'

export const collectionSlugSchema = z.enum([
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
])
export type CollectionSlug = z.infer<typeof collectionSlugSchema>

export const raritySchema = z.enum(['common', 'rare'])
export type Rarity = z.infer<typeof raritySchema>

export const nftSortSchema = z.enum(['recent', 'price_asc', 'price_desc', 'name_asc'])
export type NftSort = z.infer<typeof nftSortSchema>

export const nftTabSchema = z.enum(['all', 'new', 'trending'])
export type NftTab = z.infer<typeof nftTabSchema>

export const editionSchema = z.object({
  id: idSchema,
  label: z.string(),
  price: ethAmountSchema,
  available: z.number().int().nonnegative(),
  supply: z.number().int().min(1),
})
export type Edition = z.infer<typeof editionSchema>

export const nftSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  image: imageSchema,
  price: ethAmountSchema,
  originalPrice: ethAmountSchema.nullable(),
  rarity: raritySchema,
  collection: collectionSlugSchema,
  network: networkSchema,
  available: z.number().int().nonnegative(),
  version: versionSchema,
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string(),
  creator: z.object({ id: idSchema, name: z.string() }),
  gallery: z.array(imageSchema).min(1),
  editions: z.array(editionSchema).min(1),
  tags: z.array(z.string()),
})
export type NftDetail = z.infer<typeof nftDetailSchema>

export const nftListQuerySchema = z.object({
  q: z.string().optional(),
  collections: z.array(collectionSlugSchema).default([]),
  networks: z.array(networkSchema).default([]),
  priceMin: ethAmountSchema.optional(),
  priceMax: ethAmountSchema.optional(),
  tab: nftTabSchema.default('all'),
  sort: nftSortSchema.default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(9),
})
export type NftListQuery = z.output<typeof nftListQuerySchema>
export type NftListQueryInput = z.input<typeof nftListQuerySchema>

export const nftFacetsSchema = z.object({
  collections: z.record(z.string(), z.number().int().nonnegative()),
  networks: z.record(z.string(), z.number().int().nonnegative()),
  price: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
})
export type NftFacets = z.infer<typeof nftFacetsSchema>

export const nftListResponseSchema = paginated(nftSummarySchema).extend({
  facets: nftFacetsSchema,
})
export type NftListResponse = z.infer<typeof nftListResponseSchema>

export const featuredNftsResponseSchema = z.object({
  items: z.array(nftSummarySchema),
})
export type FeaturedNftsResponse = z.infer<typeof featuredNftsResponseSchema>
