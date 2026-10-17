import { http, HttpResponse } from 'msw'
import {
  addCartItemRequestSchema,
  applyCouponRequestSchema,
  updateCartItemRequestSchema,
} from '@/contracts/cart'
import type { Cart } from '@/contracts/cart'
import { endpoints } from '@/contracts/endpoints'
import { apiUrl } from '../config'
import { getDb, updateDb } from '../db/store'
import type { CartRecord, MockDb } from '../db/types'
import {
  addToLines,
  emptyCartRecord,
  evaluateCoupon,
  hydrateCart,
  lineId,
  mergeLines,
  setLineQuantity,
} from '../domain/cart'
import type { LineMutation } from '../domain/cart'
import { authenticate } from '../utils/auth'
import { resolveCartOwner, readGuestToken } from '../utils/cart-owner'
import { errorResponse } from '../utils/errors'
import { simulateLatency } from '../utils/latency'

const itemPath = `${endpoints.cart.items}/:itemId`

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function cartResponse(ownerKey: string, status = 200) {
  const db = getDb()
  const body: Cart = hydrateCart(db, ownerKey, db.carts[ownerKey], Date.now())
  return HttpResponse.json(body, { status })
}

function commit(ownerKey: string, change: (record: CartRecord) => Partial<CartRecord>) {
  updateDb((db) => {
    const current = db.carts[ownerKey] ?? emptyCartRecord()
    db.carts[ownerKey] = { ...current, ...change(current), version: current.version + 1 }
  })
}

function findEdition(db: MockDb, nftId: string, editionId: string) {
  const nft = db.nfts.find((candidate) => candidate.id === nftId)
  const edition = nft?.editions.find((candidate) => candidate.id === editionId)
  return nft && edition ? { nft, edition } : null
}

function conflict(mutation: Extract<LineMutation, { ok: false }>) {
  return errorResponse(409, 'availability_conflict', mutation.message, undefined)
}

export const cartHandlers = [
  http.get(apiUrl(endpoints.cart.root), async ({ request }) => {
    await simulateLatency()

    const owner = resolveCartOwner(request)
    if (owner.error) return owner.error
    return cartResponse(owner.key)
  }),

  http.post(apiUrl(endpoints.cart.items), async ({ request }) => {
    await simulateLatency()

    const owner = resolveCartOwner(request)
    if (owner.error) return owner.error

    const parsed = addCartItemRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return errorResponse(422, 'validation_error', 'Item inválido', {
        quantity: ['A quantidade deve ser um número inteiro maior que zero'],
      })
    }

    const { nftId, editionId, quantity } = parsed.data
    const db = getDb()
    const found = findEdition(db, nftId, editionId)
    if (!found) {
      return errorResponse(404, 'not_found', 'NFT ou edição não encontrados')
    }

    const mutation = addToLines(db.carts[owner.key]?.lines ?? [], found.edition, nftId, quantity)
    if (!mutation.ok) {
      return conflict(mutation)
    }

    commit(owner.key, () => ({ lines: mutation.lines }))
    return cartResponse(owner.key, 201)
  }),

  http.patch(apiUrl(itemPath), async ({ request, params }) => {
    await simulateLatency()

    const owner = resolveCartOwner(request)
    if (owner.error) return owner.error

    const parsed = updateCartItemRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return errorResponse(422, 'validation_error', 'Quantidade inválida', {
        quantity: ['A quantidade deve ser um número inteiro maior que zero'],
      })
    }

    const db = getDb()
    const existing = db.carts[owner.key]?.lines.find(
      (candidate) => lineId(candidate.nftId, candidate.editionId) === String(params.itemId),
    )
    const found = existing ? findEdition(db, existing.nftId, existing.editionId) : null
    if (!existing || !found) {
      return errorResponse(404, 'not_found', 'Item não encontrado no carrinho')
    }

    const mutation = setLineQuantity(
      db.carts[owner.key]?.lines ?? [],
      found.edition,
      existing.nftId,
      parsed.data.quantity,
    )
    if (!mutation.ok) {
      return conflict(mutation)
    }

    commit(owner.key, () => ({ lines: mutation.lines }))
    return cartResponse(owner.key)
  }),

  http.delete(apiUrl(itemPath), async ({ request, params }) => {
    await simulateLatency()

    const owner = resolveCartOwner(request)
    if (owner.error) return owner.error

    const itemId = String(params.itemId)
    commit(owner.key, (record) => ({
      lines: record.lines.filter((line) => lineId(line.nftId, line.editionId) !== itemId),
    }))
    return cartResponse(owner.key)
  }),

  http.put(apiUrl(endpoints.cart.coupon), async ({ request }) => {
    await simulateLatency()

    const owner = resolveCartOwner(request)
    if (owner.error) return owner.error

    const parsed = applyCouponRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return errorResponse(422, 'validation_error', 'Informe o código promocional', {
        code: ['Informe o código promocional'],
      })
    }

    const evaluation = evaluateCoupon(getDb().coupons, parsed.data.code, Date.now())
    if (!evaluation.ok) {
      const message = evaluation.reason === 'expired' ? 'Este cupom expirou' : 'Cupom inválido'
      return errorResponse(
        422,
        evaluation.reason === 'expired' ? 'coupon_expired' : 'coupon_invalid',
        message,
        { code: [message] },
      )
    }

    commit(owner.key, () => ({ couponCode: evaluation.coupon.code }))
    return cartResponse(owner.key)
  }),

  http.delete(apiUrl(endpoints.cart.coupon), async ({ request }) => {
    await simulateLatency()

    const owner = resolveCartOwner(request)
    if (owner.error) return owner.error

    commit(owner.key, () => ({ couponCode: null }))
    return cartResponse(owner.key)
  }),

  http.post(apiUrl(endpoints.cart.merge), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    const userKey = `user:${result.user.id}`
    const guestToken = readGuestToken(request)
    const guestKey = guestToken ? `guest:${guestToken}` : null
    const guest = guestKey ? getDb().carts[guestKey] : undefined

    if (guestKey && guest && guest.lines.length > 0) {
      updateDb((db) => {
        const current = db.carts[userKey] ?? emptyCartRecord()
        db.carts[userKey] = {
          lines: mergeLines(current.lines, guest.lines, db),
          couponCode: current.couponCode ?? guest.couponCode,
          version: current.version + 1,
        }
        delete db.carts[guestKey]
      })
    }

    return cartResponse(userKey)
  }),
]
