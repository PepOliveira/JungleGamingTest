import { http, HttpResponse } from 'msw'
import { endpoints } from '@/contracts/endpoints'
import { nftListQuerySchema } from '@/contracts/nft'
import type { FeaturedNftsResponse, NftDetail, NftListResponse } from '@/contracts/nft'
import { apiUrl } from '../config'
import { getDb } from '../db/store'
import { buildFacets, filterNfts, paginate, sortNfts, toDetail, toSummary } from '../domain/catalog'
import { errorResponse } from '../utils/errors'
import { simulateLatency } from '../utils/latency'

const FEATURED_COUNT = 4

function parseListQuery(url: URL) {
  const params = url.searchParams
  return nftListQuerySchema.safeParse({
    q: params.get('q') ?? undefined,
    collections: params.getAll('collections'),
    networks: params.getAll('networks'),
    priceMin: params.get('priceMin') ?? undefined,
    priceMax: params.get('priceMax') ?? undefined,
    tab: params.get('tab') ?? undefined,
    sort: params.get('sort') ?? undefined,
    page: params.get('page') ?? undefined,
    pageSize: params.get('pageSize') ?? undefined,
  })
}

function fieldErrorsFrom(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of issues) {
    const field = String(issue.path[0] ?? 'query')
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message]
  }
  return fieldErrors
}

export const nftHandlers = [
  http.get(apiUrl(endpoints.nfts.list), async ({ request }) => {
    await simulateLatency()

    const parsed = parseListQuery(new URL(request.url))
    if (!parsed.success) {
      return errorResponse(
        422,
        'validation_error',
        'Parâmetros de busca inválidos',
        fieldErrorsFrom(parsed.error.issues),
      )
    }

    const query = parsed.data
    const { nfts } = getDb()
    const sorted = sortNfts(filterNfts(nfts, query), query.sort)
    const page = paginate(sorted.map(toSummary), query.page, query.pageSize)

    const body: NftListResponse = { ...page, facets: buildFacets(nfts, query) }
    return HttpResponse.json(body)
  }),

  http.get(apiUrl(endpoints.nfts.featured), async () => {
    await simulateLatency()

    const { nfts } = getDb()
    const featured = [...nfts]
      .sort(
        (a, b) =>
          Number(b.rarity === 'rare') - Number(a.rarity === 'rare') || b.popularity - a.popularity,
      )
      .slice(0, FEATURED_COUNT)
      .map(toSummary)

    const body: FeaturedNftsResponse = { items: featured }
    return HttpResponse.json(body)
  }),

  http.get(apiUrl(`${endpoints.nfts.list}/:id`), async ({ params }) => {
    await simulateLatency()

    const id = String(params.id)
    const nft = getDb().nfts.find((candidate) => candidate.id === id)
    if (!nft) {
      return errorResponse(404, 'not_found', 'NFT não encontrado')
    }

    const body: NftDetail = toDetail(nft)
    return HttpResponse.json(body)
  }),
]
