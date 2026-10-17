import { http, HttpResponse } from 'msw'
import { endpoints } from '@/contracts/endpoints'
import type { FavoritesResponse } from '@/contracts/favorites'
import { apiUrl } from '../config'
import { getDb, updateDb } from '../db/store'
import { toSummary } from '../domain/catalog'
import { authenticate } from '../utils/auth'
import { errorResponse } from '../utils/errors'
import { simulateLatency } from '../utils/latency'

const itemPath = `${endpoints.favorites.list}/:nftId`

export const favoriteHandlers = [
  http.get(apiUrl(endpoints.favorites.list), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) {
      return result.error
    }

    const db = getDb()
    const ids = db.favorites[result.user.id] ?? []
    const items = ids.flatMap((id) => {
      const nft = db.nfts.find((candidate) => candidate.id === id)
      return nft ? [toSummary(nft)] : []
    })

    const body: FavoritesResponse = { items }
    return HttpResponse.json(body)
  }),

  http.put(apiUrl(itemPath), async ({ request, params }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) {
      return result.error
    }

    const nftId = String(params.nftId)
    if (!getDb().nfts.some((candidate) => candidate.id === nftId)) {
      return errorResponse(404, 'not_found', 'NFT não encontrado')
    }

    updateDb((db) => {
      const current = db.favorites[result.user.id] ?? []
      if (!current.includes(nftId)) {
        db.favorites[result.user.id] = [...current, nftId]
      }
    })
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete(apiUrl(itemPath), async ({ request, params }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) {
      return result.error
    }

    const nftId = String(params.nftId)
    updateDb((db) => {
      db.favorites[result.user.id] = (db.favorites[result.user.id] ?? []).filter(
        (id) => id !== nftId,
      )
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
