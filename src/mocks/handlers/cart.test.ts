import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { authResponseSchema } from '@/contracts/auth'
import { cartSchema } from '@/contracts/cart'
import { endpoints, GUEST_CART_HEADER } from '@/contracts/endpoints'
import { isApiError } from '@/shared/api/api-error'
import type { ApiError } from '@/shared/api/api-error'
import { apiRequest } from '@/shared/api/request'
import { resetDb } from '../db/store'
import { demoCredentials } from '../fixtures/users'
import { setScenario } from '../scenarios'
import { server } from '../server'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  setScenario('instant')
  resetDb()
})

type Headers = Record<string, string>

const guest = (token = 'guest-token-1'): Headers => ({ [GUEST_CART_HEADER]: token })

async function userHeaders(index: number, token = 'guest-token-1'): Promise<Headers> {
  const auth = await apiRequest(
    { method: 'POST', url: endpoints.auth.login, data: demoCredentials[index] },
    authResponseSchema,
  )
  return { Authorization: `Bearer ${auth.accessToken}`, ...guest(token) }
}

const getCart = (headers: Headers) => apiRequest({ url: endpoints.cart.root, headers }, cartSchema)
const addItem = (headers: Headers, nftId: string, editionId: string, quantity: number) =>
  apiRequest(
    { method: 'POST', url: endpoints.cart.items, headers, data: { nftId, editionId, quantity } },
    cartSchema,
  )
const setQuantity = (headers: Headers, itemId: string, quantity: number) =>
  apiRequest(
    { method: 'PATCH', url: endpoints.cart.item(itemId), headers, data: { quantity } },
    cartSchema,
  )
const removeItem = (headers: Headers, itemId: string) =>
  apiRequest({ method: 'DELETE', url: endpoints.cart.item(itemId), headers }, cartSchema)
const applyCoupon = (headers: Headers, code: string) =>
  apiRequest({ method: 'PUT', url: endpoints.cart.coupon, headers, data: { code } }, cartSchema)
const removeCoupon = (headers: Headers) =>
  apiRequest({ method: 'DELETE', url: endpoints.cart.coupon, headers }, cartSchema)
const merge = (headers: Headers) =>
  apiRequest({ method: 'POST', url: endpoints.cart.merge, headers }, cartSchema)

async function failure(promise: Promise<unknown>) {
  const error = await promise.catch((reason: unknown) => reason)
  if (!isApiError(error)) throw new Error('Expected an ApiError')
  return error as ApiError
}

const ITEM_A = 'nft_001__nft_001_fiftieth'
const ITEM_B = 'nft_002__nft_002_fiftieth'

describe('guest cart', () => {
  it('starts empty with zeroed totals', async () => {
    const cart = await getCart(guest())
    expect(cart.items).toEqual([])
    expect(cart.summary).toEqual({ subtotal: '0', discount: '0', networkFee: '0', total: '0' })
  })

  it('requires a cart identity', async () => {
    const error = await failure(apiRequest({ url: endpoints.cart.root }, cartSchema))
    expect(error.status).toBe(400)
  })

  it('adds items and computes totals on the server', async () => {
    await addItem(guest(), 'nft_001', 'nft_001_fiftieth', 2)
    const cart = await addItem(guest(), 'nft_002', 'nft_002_fiftieth', 1)
    expect(cart.items.map((item) => item.id)).toEqual([ITEM_A, ITEM_B])
    expect(cart.summary).toEqual({
      subtotal: '4.07',
      discount: '0',
      networkFee: '0.016',
      total: '4.086',
    })
  })

  it('keeps the cart between requests (refresh)', async () => {
    await addItem(guest(), 'nft_001', 'nft_001_fiftieth', 1)
    expect((await getCart(guest())).items).toHaveLength(1)
  })

  it('isolates carts of different visitors', async () => {
    await addItem(guest('guest-token-1'), 'nft_001', 'nft_001_fiftieth', 1)
    expect((await getCart(guest('guest-token-2'))).items).toEqual([])
  })

  it('updates and removes items', async () => {
    await addItem(guest(), 'nft_001', 'nft_001_fiftieth', 1)
    expect((await setQuantity(guest(), ITEM_A, 4)).items[0]?.quantity).toBe(4)
    expect((await removeItem(guest(), ITEM_A)).items).toEqual([])
  })

  it('rejects quantities above availability', async () => {
    const error = await failure(addItem(guest(), 'nft_001', 'nft_001_fiftieth', 11))
    expect(error.status).toBe(409)
    expect(error.code).toBe('availability_conflict')
  })

  it('rejects sold out editions and unknown items', async () => {
    expect((await failure(addItem(guest(), 'nft_012', 'nft_012_fiftieth', 1))).code).toBe(
      'availability_conflict',
    )
    expect((await failure(addItem(guest(), 'nft_999', 'x', 1))).kind).toBe('not_found')
    expect((await failure(setQuantity(guest(), 'nft_001__nope', 1))).kind).toBe('not_found')
  })

  it('validates the quantity', async () => {
    const error = await failure(addItem(guest(), 'nft_001', 'nft_001_fiftieth', 0))
    expect(error.status).toBe(422)
    expect(error.fieldErrors.quantity).toBeDefined()
  })
})

describe('coupons', () => {
  it('applies and removes a valid coupon', async () => {
    await addItem(guest(), 'nft_001', 'nft_001_fiftieth', 2)
    const applied = await applyCoupon(guest(), 'kurio10')
    expect(applied.couponCode).toBe('KURIO10')
    expect(applied.summary.discount).toBe('0.238')
    expect((await removeCoupon(guest())).summary.discount).toBe('0')
  })

  it('reports invalid and expired codes with field errors', async () => {
    const invalid = await failure(applyCoupon(guest(), 'NOPE'))
    expect(invalid.status).toBe(422)
    expect(invalid.code).toBe('coupon_invalid')
    expect(invalid.fieldErrors.code).toEqual(['Cupom inválido'])
    const expired = await failure(applyCoupon(guest(), 'EXPIRADO20'))
    expect(expired.code).toBe('coupon_expired')
  })
})

describe('authenticated cart', () => {
  it('rejects invalid sessions', async () => {
    const error = await failure(getCart({ Authorization: 'Bearer nope', ...guest() }))
    expect(error.status).toBe(401)
  })

  it('merges the visitor cart when the user signs in and clears the guest cart', async () => {
    await addItem(guest(), 'nft_001', 'nft_001_fiftieth', 2)
    const headers = await userHeaders(0)
    await addItem(
      { Authorization: headers.Authorization ?? '', ...guest('other-guest-token') },
      'nft_002',
      'nft_002_fiftieth',
      1,
    )

    const merged = await merge(headers)
    expect(merged.items.map((item) => [item.id, item.quantity])).toEqual([
      [ITEM_B, 1],
      [ITEM_A, 2],
    ])
    expect((await getCart(guest())).items).toEqual([])
  })

  it('keeps each user cart separate and persistent', async () => {
    const marina = await userHeaders(0)
    const rafael = await userHeaders(1)
    await addItem(marina, 'nft_003', 'nft_003_fiftieth', 1)
    expect((await getCart(rafael)).items).toEqual([])
    expect((await getCart(marina)).items).toHaveLength(1)
  })

  it('keeps the existing user coupon over the guest one', async () => {
    const marina = await userHeaders(0)
    await applyCoupon(marina, 'BEMVINDO')
    await addItem(guest(), 'nft_001', 'nft_001_fiftieth', 1)
    await applyCoupon(guest(), 'KURIO10')
    expect((await merge(marina)).couponCode).toBe('BEMVINDO')
  })
})
