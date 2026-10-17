import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Cart } from '@/contracts/cart'
import type { NftDetail } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/realtime'
import { nftKeys } from '@/features/catalog/api/catalog-queries'
import { orderKey } from '@/features/orders/use-order'
import { createSeedDb } from '@/mocks/db/seed'
import {
  applyNftUpdated,
  applyOrderUpdated,
  handleNftPayload,
  handleOrderPayload,
} from './apply-events'
import { createEventLedger } from './event-ledger'

const seedNft = createSeedDb().nfts[0]!
const detail: NftDetail = { ...seedNft, version: 3, price: '0.5' }

function nftEvent(overrides: Partial<NftUpdatedEvent> = {}): NftUpdatedEvent {
  return {
    eventId: 'evt_000001',
    type: 'nft.updated',
    version: 4,
    occurredAt: '2026-10-16T12:00:00.000Z',
    resource: { type: 'nft', id: detail.id },
    data: {
      price: '0.9',
      originalPrice: null,
      available: 2,
      editions: detail.editions.map((edition) => ({
        id: edition.id,
        price: '0.9',
        available: 2,
      })),
    },
    ...overrides,
  }
}

const order: Order = {
  id: 'order_1',
  status: 'pending',
  network: 'ethereum',
  walletLabel: 'Principal',
  walletProvider: 'metamask',
  walletAddress: '0xabc',
  collector: { fullName: 'Marina', email: 'marina@kurio.dev' },
  note: null,
  items: [],
  couponCode: null,
  subtotal: '0.5',
  discount: '0',
  networkFee: '0.016',
  total: '0.516',
  transactionHash: null,
  explorerUrl: null,
  declineReason: null,
  createdAt: '2026-10-16T11:00:00.000Z',
  updatedAt: '2026-10-16T11:00:00.000Z',
  version: 1,
}

function orderEvent(overrides: Partial<OrderUpdatedEvent> = {}): OrderUpdatedEvent {
  return {
    eventId: 'evt_000010',
    type: 'order.updated',
    version: 2,
    occurredAt: '2026-10-16T12:05:00.000Z',
    userId: 'user_1',
    resource: { type: 'order', id: order.id },
    data: {
      status: 'confirmed',
      transactionHash: '0xhash',
      explorerUrl: 'https://etherscan.io/tx/0xhash',
      declineReason: null,
    },
    ...overrides,
  }
}

describe('applyNftUpdated', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.setQueryData(nftKeys.detail(detail.id), detail)
    queryClient.setQueryData(nftKeys.list({} as never), {
      items: [{ ...seedNft, version: 3, price: '0.5' }],
    })
  })

  it('updates detail and list caches when the event is newer', () => {
    const result = applyNftUpdated(queryClient, nftEvent())

    const cached = queryClient.getQueryData<NftDetail>(nftKeys.detail(detail.id))
    expect(result.applied).toBe(true)
    expect(cached?.price).toBe('0.9')
    expect(cached?.version).toBe(4)
    expect(cached?.editions[0]?.available).toBe(2)
    const list = queryClient.getQueryData<{ items: NftDetail[] }>(nftKeys.list({} as never))
    expect(list?.items[0]?.price).toBe('0.9')
  })

  it('ignores events that are older or equal to the cached version', () => {
    const stale = applyNftUpdated(queryClient, nftEvent({ version: 2 }))
    const same = applyNftUpdated(queryClient, nftEvent({ version: 3 }))

    const cached = queryClient.getQueryData<NftDetail>(nftKeys.detail(detail.id))
    expect(stale.applied).toBe(false)
    expect(same.applied).toBe(false)
    expect(cached?.price).toBe('0.5')
    expect(cached?.version).toBe(3)
  })

  it('refreshes the cart when the updated nft is in it', () => {
    const cart = {
      id: 'cart_1',
      items: [{ nftId: detail.id, name: detail.name }],
    } as unknown as Cart
    queryClient.setQueryData(['cart', 'user_1'], cart)

    const result = applyNftUpdated(queryClient, nftEvent())

    expect(result.inCart).toBe(true)
    expect(queryClient.getQueryState(['cart', 'user_1'])?.isInvalidated).toBe(true)
  })

  it('does not touch the cart for nfts that are not in it', () => {
    queryClient.setQueryData(['cart', 'user_1'], { id: 'cart_1', items: [] })

    const result = applyNftUpdated(queryClient, nftEvent())

    expect(result.inCart).toBe(false)
    expect(queryClient.getQueryState(['cart', 'user_1'])?.isInvalidated).toBe(false)
  })
})

describe('applyOrderUpdated', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.setQueryData(orderKey('user_1', order.id), order)
  })

  it('updates the cached order for its owner', () => {
    const result = applyOrderUpdated(queryClient, orderEvent(), 'user_1')

    const cached = queryClient.getQueryData<Order>(orderKey('user_1', order.id))
    expect(result.applied).toBe(true)
    expect(cached?.status).toBe('confirmed')
    expect(cached?.transactionHash).toBe('0xhash')
    expect(cached?.version).toBe(2)
  })

  it('never applies events that belong to another user', () => {
    const result = applyOrderUpdated(queryClient, orderEvent({ userId: 'user_2' }), 'user_1')

    expect(result.applied).toBe(false)
    expect(queryClient.getQueryData<Order>(orderKey('user_1', order.id))?.status).toBe('pending')
  })

  it('ignores events when nobody is signed in', () => {
    expect(applyOrderUpdated(queryClient, orderEvent(), null).applied).toBe(false)
  })

  it('ignores outdated order versions', () => {
    queryClient.setQueryData(orderKey('user_1', order.id), { ...order, version: 5 })

    const result = applyOrderUpdated(queryClient, orderEvent({ version: 3 }), 'user_1')

    expect(result.applied).toBe(false)
    expect(queryClient.getQueryData<Order>(orderKey('user_1', order.id))?.version).toBe(5)
  })

  it('invalidates instead of writing when the order is not cached', () => {
    const empty = new QueryClient()

    const result = applyOrderUpdated(empty, orderEvent(), 'user_1')

    expect(result.applied).toBe(true)
    expect(empty.getQueryData(orderKey('user_1', order.id))).toBeUndefined()
  })
})

describe('payload handlers', () => {
  it('drops malformed payloads', () => {
    const context = {
      queryClient: new QueryClient(),
      ledger: createEventLedger(),
      getUserId: () => 'user_1',
    }

    expect(handleNftPayload({ nope: true }, context)).toBeNull()
    expect(handleOrderPayload('garbage', context)).toBeNull()
  })

  it('applies a duplicated event only once', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(nftKeys.detail(detail.id), detail)
    const context = { queryClient, ledger: createEventLedger(), getUserId: () => 'user_1' }

    const first = handleNftPayload(nftEvent(), context)
    const second = handleNftPayload(nftEvent(), context)

    expect(first?.applied).toBe(true)
    expect(second).toBeNull()
  })
})
