import { realtimeEventNames } from '@/contracts/realtime'
import type { RealtimeEvent } from '@/contracts/realtime'
import { getDb, updateDb } from '../db/store'
import { settleOrder } from '../domain/orders'
import { buildNftUpdatedEvent, buildOrderUpdatedEvent } from './events'
import { hasSubscribers, publishAll } from './hub'

export function settleDueOrders(userId?: string) {
  const events = updateDb((db) => {
    const now = Date.now()
    const collected: RealtimeEvent[] = []

    for (const order of db.orders) {
      if (userId && order.userId !== userId) continue
      if (!settleOrder(db, order, now)) continue

      collected.push(buildOrderUpdatedEvent(db, order, now))
      if (order.status === 'confirmed') {
        const touched = new Set(order.items.map((item) => item.nftId))
        for (const nft of db.nfts) {
          if (touched.has(nft.id)) collected.push(buildNftUpdatedEvent(db, nft, now))
        }
      }
    }

    return collected
  })

  publishAll(events)
  return events.filter((event) => event.type === realtimeEventNames.orderUpdated).length
}

export function scheduleSettlement(orderId: string) {
  if (!hasSubscribers()) return

  const order = getDb().orders.find((candidate) => candidate.id === orderId)
  if (!order) return

  const delay = Math.max(0, Date.parse(order.settleAt) - Date.now()) + 50
  setTimeout(() => settleDueOrders(order.userId), delay)
}
