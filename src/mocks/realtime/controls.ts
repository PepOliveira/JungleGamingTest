import { realtimeEventNames } from '@/contracts/realtime'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/realtime'
import { updateDb } from '../db/store'
import { buildNftUpdatedEvent } from './events'
import { broadcastRaw, disconnectAll, publish, replayLastEvent, setOffline } from './hub'

export type NftPatch = {
  price?: string
  available?: number
}

export type RealtimeControls = {
  emitNftUpdate: (nftId: string, patch: NftPatch) => NftUpdatedEvent | null
  emitStaleNftUpdate: (nftId: string) => NftUpdatedEvent | null
  emitForeignOrderUpdate: (orderId: string) => OrderUpdatedEvent
  replayLastEvent: () => void
  disconnect: () => void
  goOffline: () => void
  goOnline: () => void
}

function applyPatch(nftId: string, patch: NftPatch) {
  return updateDb((db) => {
    const nft = db.nfts.find((candidate) => candidate.id === nftId)
    if (!nft) return null

    const edition = nft.editions.find((candidate) => candidate.id === nft.defaultEditionId)
    if (patch.price !== undefined) {
      nft.price = patch.price
      if (edition) edition.price = patch.price
    }
    if (patch.available !== undefined && edition) {
      edition.available = patch.available
      nft.available = nft.editions.reduce((total, current) => total + current.available, 0)
    }
    nft.version += 1

    return buildNftUpdatedEvent(db, nft, Date.now())
  })
}

export const realtimeControls: RealtimeControls = {
  emitNftUpdate(nftId, patch) {
    const event = applyPatch(nftId, patch)
    if (event) publish(event)
    return event
  },

  emitStaleNftUpdate(nftId) {
    const event = updateDb((db) => {
      const nft = db.nfts.find((candidate) => candidate.id === nftId)
      return nft ? buildNftUpdatedEvent(db, nft, Date.now()) : null
    })
    if (!event) return null

    const stale: NftUpdatedEvent = {
      ...event,
      version: Math.max(0, event.version - 1),
      data: { ...event.data, price: '0.001', available: 0 },
    }
    publish(stale)
    return stale
  },

  emitForeignOrderUpdate(orderId) {
    const event: OrderUpdatedEvent = updateDb((db) => {
      db.eventSequence += 1
      return {
        eventId: `evt_${String(db.eventSequence).padStart(6, '0')}`,
        type: realtimeEventNames.orderUpdated,
        version: 99,
        occurredAt: new Date().toISOString(),
        userId: 'user_foreign',
        resource: { type: 'order', id: orderId },
        data: {
          status: 'declined',
          transactionHash: null,
          explorerUrl: null,
          declineReason: 'Evento de outro usuário',
        },
      }
    })
    broadcastRaw(event)
    return event
  },

  replayLastEvent,
  disconnect: disconnectAll,
  goOffline: () => setOffline(true),
  goOnline: () => setOffline(false),
}
