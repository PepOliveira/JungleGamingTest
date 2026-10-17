import type { QueryClient } from '@tanstack/react-query'
import type { Cart } from '@/contracts/cart'
import type { NftDetail, NftSummary } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import { nftUpdatedEventSchema, orderUpdatedEventSchema } from '@/contracts/realtime'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/realtime'
import { nftKeys } from '@/features/catalog/api/catalog-queries'
import { orderKey } from '@/features/orders/use-order'
import { announce } from '@/shared/lib/announcer'
import type { EventLedger } from './event-ledger'

type ItemsPayload = { items: NftSummary[] }

export function mergeNftSummary<T extends NftSummary>(nft: T, event: NftUpdatedEvent): T {
  if (nft.version >= event.version) {
    return nft
  }
  return {
    ...nft,
    price: event.data.price,
    originalPrice: event.data.originalPrice,
    available: event.data.available,
    version: event.version,
  }
}

export function mergeNftDetail(nft: NftDetail, event: NftUpdatedEvent): NftDetail {
  if (nft.version >= event.version) {
    return nft
  }
  return {
    ...mergeNftSummary(nft, event),
    editions: nft.editions.map((edition) => {
      const next = event.data.editions.find((candidate) => candidate.id === edition.id)
      return next ? { ...edition, price: next.price, available: next.available } : edition
    }),
  }
}

function mergeItems<T extends ItemsPayload>(payload: T | undefined, event: NftUpdatedEvent) {
  if (!payload || !Array.isArray(payload.items)) {
    return payload
  }
  let changed = false
  const items = payload.items.map((item) => {
    if (item.id !== event.resource.id) return item
    const next = mergeNftSummary(item, event)
    if (next !== item) changed = true
    return next
  })
  return changed ? { ...payload, items } : payload
}

function findCartItemName(queryClient: QueryClient, nftId: string) {
  const carts = queryClient.getQueriesData<Cart>({ queryKey: ['cart'] })
  for (const [, cart] of carts) {
    const item = cart?.items?.find((candidate) => candidate.nftId === nftId)
    if (item) return item.name
  }
  return null
}

export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  const nftId = event.resource.id

  const detailKey = nftKeys.detail(nftId)
  const detail = queryClient.getQueryData<NftDetail>(detailKey)
  const applied = detail ? detail.version < event.version : true

  queryClient.setQueryData<NftDetail>(detailKey, (current) =>
    current ? mergeNftDetail(current, event) : current,
  )
  queryClient.setQueriesData<ItemsPayload>({ queryKey: nftKeys.lists() }, (current) =>
    mergeItems(current, event),
  )
  queryClient.setQueriesData<ItemsPayload>({ queryKey: nftKeys.featured() }, (current) =>
    mergeItems(current, event),
  )
  queryClient.setQueriesData<ItemsPayload>(
    {
      predicate: (query) =>
        query.queryKey[0] === 'nfts' &&
        query.queryKey[1] === 'detail' &&
        query.queryKey[3] === 'related',
    },
    (current) => mergeItems(current, event),
  )

  void queryClient.invalidateQueries({ queryKey: nftKeys.lists(), refetchType: 'none' })

  const cartItemName = applied ? findCartItemName(queryClient, nftId) : null
  if (cartItemName !== null) {
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    announce(`${cartItemName}: preço ou disponibilidade atualizados. Revise seu carrinho.`, {
      visible: true,
    })
  }

  return { applied, inCart: cartItemName !== null }
}

export function applyOrderUpdated(
  queryClient: QueryClient,
  event: OrderUpdatedEvent,
  currentUserId: string | null,
) {
  if (!currentUserId || event.userId !== currentUserId) {
    return { applied: false }
  }

  const key = orderKey(currentUserId, event.resource.id)
  const cached = queryClient.getQueryData<Order>(key)

  if (!cached) {
    void queryClient.invalidateQueries({ queryKey: key })
    return { applied: true }
  }
  if (cached.version >= event.version) {
    return { applied: false }
  }

  queryClient.setQueryData<Order>(key, {
    ...cached,
    status: event.data.status,
    transactionHash: event.data.transactionHash,
    explorerUrl: event.data.explorerUrl,
    declineReason: event.data.declineReason,
    version: event.version,
    updatedAt: event.occurredAt,
  })

  if (event.data.status !== 'pending') {
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
  }

  const watched = queryClient.getQueryCache().find({ queryKey: key })?.getObserversCount() ?? 0
  if (watched === 0 && event.data.status !== 'pending') {
    announce(
      event.data.status === 'confirmed'
        ? 'Seu pedido foi confirmado.'
        : 'O pagamento do seu pedido foi recusado.',
      { visible: true, tone: event.data.status === 'confirmed' ? 'info' : 'error' },
    )
  }

  return { applied: true }
}

export function reconcileAfterReconnect(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: nftKeys.all })
  void queryClient.invalidateQueries({ queryKey: ['cart'] })
  void queryClient.invalidateQueries({ queryKey: ['orders'] })
}

type HandlerContext = {
  queryClient: QueryClient
  ledger: EventLedger
  getUserId: () => string | null
}

export function handleNftPayload(payload: unknown, context: HandlerContext) {
  const parsed = nftUpdatedEventSchema.safeParse(payload)
  if (!parsed.success || context.ledger.seen(parsed.data.eventId)) {
    return null
  }
  return applyNftUpdated(context.queryClient, parsed.data)
}

export function handleOrderPayload(payload: unknown, context: HandlerContext) {
  const parsed = orderUpdatedEventSchema.safeParse(payload)
  if (!parsed.success || context.ledger.seen(parsed.data.eventId)) {
    return null
  }
  return applyOrderUpdated(context.queryClient, parsed.data, context.getUserId())
}
