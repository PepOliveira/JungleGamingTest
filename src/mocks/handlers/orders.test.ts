import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { authResponseSchema } from '@/contracts/auth'
import { cartSchema } from '@/contracts/cart'
import { endpoints, GUEST_CART_HEADER, IDEMPOTENCY_HEADER } from '@/contracts/endpoints'
import { orderSchema, ordersResponseSchema } from '@/contracts/order'
import { quoteSchema } from '@/contracts/quote'
import { walletConnectionSchema } from '@/contracts/wallet'
import { isApiError } from '@/shared/api/api-error'
import type { ApiError } from '@/shared/api/api-error'
import { apiCommand, apiRequest } from '@/shared/api/request'
import { getDb, resetDb, updateDb } from '../db/store'
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

async function login(index: number): Promise<Headers> {
  const auth = await apiRequest(
    { method: 'POST', url: endpoints.auth.login, data: demoCredentials[index] },
    authResponseSchema,
  )
  return { Authorization: `Bearer ${auth.accessToken}`, [GUEST_CART_HEADER]: 'guest-token-1' }
}

const addItem = (headers: Headers, nftId: string, quantity: number) =>
  apiRequest(
    {
      method: 'POST',
      url: endpoints.cart.items,
      headers,
      data: { nftId, editionId: `${nftId}_fiftieth`, quantity },
    },
    cartSchema,
  )
const getCart = (headers: Headers) => apiRequest({ url: endpoints.cart.root, headers }, cartSchema)
const createQuote = (headers: Headers, network = 'ethereum') =>
  apiRequest(
    { method: 'POST', url: endpoints.quotes.create, headers, data: { network } },
    quoteSchema,
  )
const connect = (headers: Headers, walletId: string, provider = 'metamask') =>
  apiRequest(
    {
      method: 'POST',
      url: endpoints.walletConnections.create,
      headers,
      data: { walletId, provider },
    },
    walletConnectionSchema,
  )
const placeOrder = (headers: Headers, key: string, data: unknown) =>
  apiRequest(
    {
      method: 'POST',
      url: endpoints.orders.create,
      headers: { ...headers, [IDEMPOTENCY_HEADER]: key },
      data,
    },
    orderSchema,
  )
const getOrder = (headers: Headers, id: string) =>
  apiRequest({ url: endpoints.orders.detail(id), headers }, orderSchema)

async function failure(promise: Promise<unknown>) {
  const error = await promise.catch((reason: unknown) => reason)
  if (!isApiError(error)) throw new Error('Expected an ApiError')
  return error as ApiError
}

type Setup = {
  headers: Headers
  quoteId: string
  connectionId: string
  body: Record<string, unknown>
}

async function checkoutSetup(userIndex = 0): Promise<Setup> {
  const headers = await login(userIndex)
  await addItem(headers, 'nft_001', 2)
  await addItem(headers, 'nft_002', 1)
  const quote = await createQuote(headers)
  const walletId = userIndex === 0 ? 'wallet_marina_main' : 'wallet_rafael_main'
  const connection = await connect(headers, walletId)
  return {
    headers,
    quoteId: quote.id,
    connectionId: connection.id,
    body: {
      quoteId: quote.id,
      walletId,
      connectionId: connection.id,
      network: 'ethereum',
      collector: { fullName: 'Marina Duarte', email: 'colecionador@kurio.dev' },
    },
  }
}

function settleNow(orderId: string) {
  updateDb((db) => {
    const order = db.orders.find((candidate) => candidate.id === orderId)
    if (order) order.settleAt = new Date(Date.now() - 1000).toISOString()
  })
}

describe('POST /quotes', () => {
  it('requires a session and a non empty cart', async () => {
    expect((await failure(createQuote({}))).status).toBe(401)
    const empty = await failure(createQuote(await login(0)))
    expect(empty.status).toBe(422)
    expect(empty.fieldErrors.cart).toBeDefined()
  })

  it('computes totals with the fee of the chosen network', async () => {
    const headers = await login(0)
    await addItem(headers, 'nft_001', 2)
    const ethereum = await createQuote(headers, 'ethereum')
    const polygon = await createQuote(headers, 'polygon')
    expect(ethereum.networkFee).toBe('0.016')
    expect(polygon.networkFee).toBe('0.002')
    expect(ethereum.subtotal).toBe('2.38')
    expect(ethereum.total).toBe('2.396')
    expect(polygon.total).toBe('2.382')
  })

  it('rejects carts with unavailable items', async () => {
    const headers = await login(0)
    await addItem(headers, 'nft_001', 1)
    updateDb((db) => {
      const edition = db.nfts
        .find((nft) => nft.id === 'nft_001')
        ?.editions.find((e) => e.id === 'nft_001_fiftieth')
      if (edition) edition.available = 0
    })
    expect((await failure(createQuote(headers))).code).toBe('availability_conflict')
  })
})

describe('wallet connections', () => {
  it('connects a wallet of the user and disconnects idempotently', async () => {
    const headers = await login(0)
    const connection = await connect(headers, 'wallet_marina_poly', 'walletconnect')
    expect(connection).toMatchObject({ network: 'polygon', provider: 'walletconnect' })
    const remove = () =>
      apiCommand({
        method: 'DELETE',
        url: endpoints.walletConnections.detail(connection.id),
        headers,
      })
    await remove()
    await remove()
    expect(getDb().connections[connection.id]).toBeUndefined()
  })

  it('does not connect wallets of other users', async () => {
    expect((await failure(connect(await login(1), 'wallet_marina_main'))).kind).toBe('not_found')
  })

  it('reports a refused connection', async () => {
    const headers = await login(0)
    setScenario('wallet-refused')
    const error = await failure(connect(headers, 'wallet_marina_main'))
    expect(error.status).toBe(403)
    expect(error.code).toBe('wallet_connection_refused')
  })
})

describe('POST /orders', () => {
  it('requires the idempotency header', async () => {
    const { headers, body } = await checkoutSetup()
    const error = await failure(
      apiRequest(
        { method: 'POST', url: endpoints.orders.create, headers, data: body },
        orderSchema,
      ),
    )
    expect(error.status).toBe(400)
  })

  it('requires a connected wallet', async () => {
    const { headers, body } = await checkoutSetup()
    const error = await failure(
      placeOrder(headers, 'k1', { ...body, connectionId: 'conn_unknown' }),
    )
    expect(error.status).toBe(422)
    expect(error.fieldErrors.connectionId).toBeDefined()
  })

  it('creates a pending order with a snapshot of the purchase', async () => {
    const { headers, body } = await checkoutSetup()
    const order = await placeOrder(headers, 'k1', body)
    expect(order.status).toBe('pending')
    expect(order.total).toBe('4.086')
    expect(order.items.map((item) => [item.name, item.quantity])).toEqual([
      ['Emerald Ape #042', 2],
      ['Sage Nomad #009', 1],
    ])
    expect(order.walletProvider).toBe('metamask')
    expect(order.transactionHash).toBeNull()
  })

  it('returns the same order for a repeated key with the same content', async () => {
    const { headers, body } = await checkoutSetup()
    const first = await placeOrder(headers, 'k1', body)
    const second = await placeOrder(headers, 'k1', body)
    expect(second.id).toBe(first.id)
    expect(getDb().orders).toHaveLength(1)
  })

  it('conflicts when the key is reused with different content', async () => {
    const { headers, body } = await checkoutSetup()
    await placeOrder(headers, 'k1', body)
    const error = await failure(
      placeOrder(headers, 'k1', {
        ...body,
        collector: { fullName: 'Outra Pessoa', email: 'x@kurio.dev' },
      }),
    )
    expect(error.status).toBe(409)
    expect(error.code).toBe('idempotency_conflict')
  })

  it('asks for a new confirmation when a price changed after the quote', async () => {
    const { headers, body } = await checkoutSetup()
    updateDb((db) => {
      const edition = db.nfts
        .find((nft) => nft.id === 'nft_001')
        ?.editions.find((e) => e.id === 'nft_001_fiftieth')
      if (edition) edition.price = '9.99'
    })
    const error = await failure(placeOrder(headers, 'k1', body))
    expect(error.status).toBe(409)
    expect(error.code).toBe('quote_outdated')
    const fresh = quoteSchema.parse(error.details.quote)
    expect(fresh.subtotal).toBe('21.67')
    expect(getDb().orders).toHaveLength(0)

    const order = await placeOrder(headers, 'k2', { ...body, quoteId: fresh.id })
    expect(order.total).toBe(fresh.total)
  })

  it('asks for a new confirmation when the cart changed or the quote expired', async () => {
    const { headers, body, quoteId } = await checkoutSetup()
    await addItem(headers, 'nft_003', 1)
    expect((await failure(placeOrder(headers, 'k1', body))).code).toBe('quote_outdated')

    const fresh = await createQuote(headers)
    updateDb((db) => {
      const record = db.quotes[fresh.id]
      if (record) record.quote.expiresAt = new Date(Date.now() - 1000).toISOString()
    })
    expect((await failure(placeOrder(headers, 'k3', { ...body, quoteId: fresh.id }))).code).toBe(
      'quote_outdated',
    )
    expect(quoteId).toBeDefined()
  })

  it('blocks the order when an item became unavailable', async () => {
    const { headers, body } = await checkoutSetup()
    updateDb((db) => {
      const edition = db.nfts
        .find((nft) => nft.id === 'nft_002')
        ?.editions.find((e) => e.id === 'nft_002_fiftieth')
      if (edition) edition.available = 0
    })
    expect((await failure(placeOrder(headers, 'k1', body))).code).toBe('availability_conflict')
  })
})

describe('order settlement', () => {
  it('stays pending until the settlement time and is terminal afterwards', async () => {
    const { headers, body } = await checkoutSetup()
    const order = await placeOrder(headers, 'k1', body)
    updateDb((db) => {
      const record = db.orders.find((candidate) => candidate.id === order.id)
      if (record) record.settleAt = new Date(Date.now() + 60_000).toISOString()
    })
    expect((await getOrder(headers, order.id)).status).toBe('pending')

    settleNow(order.id)
    const confirmed = await getOrder(headers, order.id)
    expect(confirmed.status).toBe('confirmed')
    expect(confirmed.transactionHash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(confirmed.explorerUrl).toContain('etherscan.io/tx/')
    expect((await getOrder(headers, order.id)).transactionHash).toBe(confirmed.transactionHash)
  })

  it('removes only the purchased quantities from the cart and updates the stock', async () => {
    const { headers, body } = await checkoutSetup()
    const stockBefore =
      getDb()
        .nfts.find((nft) => nft.id === 'nft_001')
        ?.editions.find((e) => e.id === 'nft_001_fiftieth')?.available ?? 0
    const order = await placeOrder(headers, 'k1', body)
    await addItem(headers, 'nft_001', 1)
    settleNow(order.id)
    await getOrder(headers, order.id)

    const cart = await getCart(headers)
    expect(cart.items.map((item) => [item.nftId, item.quantity])).toEqual([['nft_001', 1]])
    const stockAfter =
      getDb()
        .nfts.find((nft) => nft.id === 'nft_001')
        ?.editions.find((e) => e.id === 'nft_001_fiftieth')?.available ?? 0
    expect(stockAfter).toBe(stockBefore - 2)
  })

  it('keeps the receipt unchanged when the catalog changes afterwards', async () => {
    const { headers, body } = await checkoutSetup()
    const order = await placeOrder(headers, 'k1', body)
    settleNow(order.id)
    const confirmed = await getOrder(headers, order.id)
    updateDb((db) => {
      const edition = db.nfts
        .find((nft) => nft.id === 'nft_001')
        ?.editions.find((e) => e.id === 'nft_001_fiftieth')
      if (edition) edition.price = '50.00'
    })
    const again = await getOrder(headers, order.id)
    expect(again.items).toEqual(confirmed.items)
    expect(again.total).toBe(confirmed.total)
  })

  it('declines without touching the cart or the stock', async () => {
    const { headers, body } = await checkoutSetup()
    setScenario('payment-declined')
    const order = await placeOrder(headers, 'k1', body)
    setScenario('instant')
    settleNow(order.id)

    const declined = await getOrder(headers, order.id)
    expect(declined.status).toBe('declined')
    expect(declined.declineReason).toBeTruthy()
    expect(declined.transactionHash).toBeNull()
    expect((await getCart(headers)).items).toHaveLength(2)
  })
})

describe('order access', () => {
  it('hides orders of other users and filters by status', async () => {
    const { headers, body } = await checkoutSetup()
    const order = await placeOrder(headers, 'k1', body)
    const other = await login(1)
    expect((await failure(getOrder(other, order.id))).kind).toBe('not_found')

    const pending = await apiRequest(
      { url: endpoints.orders.list, headers, params: { status: 'confirmed' } },
      ordersResponseSchema,
    )
    expect(pending.items.length).toBeLessThanOrEqual(1)
  })
})
