import { realtimeEventNames } from '@/contracts/realtime'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/realtime'
import type { MockDb, NftRecord, OrderRecord } from '../db/types'

function nextEventId(db: MockDb) {
  db.eventSequence += 1
  return `evt_${String(db.eventSequence).padStart(6, '0')}`
}

export function buildNftUpdatedEvent(db: MockDb, nft: NftRecord, now: number): NftUpdatedEvent {
  return {
    eventId: nextEventId(db),
    type: realtimeEventNames.nftUpdated,
    version: nft.version,
    occurredAt: new Date(now).toISOString(),
    resource: { type: 'nft', id: nft.id },
    data: {
      price: nft.price,
      originalPrice: nft.originalPrice,
      available: nft.available,
      editions: nft.editions.map((edition) => ({
        id: edition.id,
        price: edition.price,
        available: edition.available,
      })),
    },
  }
}

export function buildOrderUpdatedEvent(
  db: MockDb,
  order: OrderRecord,
  now: number,
): OrderUpdatedEvent {
  return {
    eventId: nextEventId(db),
    type: realtimeEventNames.orderUpdated,
    version: order.version,
    occurredAt: new Date(now).toISOString(),
    userId: order.userId,
    resource: { type: 'order', id: order.id },
    data: {
      status: order.status,
      transactionHash: order.transactionHash,
      explorerUrl: order.explorerUrl,
      declineReason: order.declineReason,
    },
  }
}
