import { z } from 'zod'
import { ethAmountSchema, idSchema, isoDateSchema, versionSchema } from './common'
import { orderStatusSchema } from './order'

export const realtimeEventNames = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
} as const

const eventBase = {
  eventId: idSchema,
  version: versionSchema,
  occurredAt: isoDateSchema,
}

export const nftUpdatedEventSchema = z.object({
  ...eventBase,
  type: z.literal(realtimeEventNames.nftUpdated),
  resource: z.object({ type: z.literal('nft'), id: idSchema }),
  data: z.object({
    price: ethAmountSchema,
    originalPrice: ethAmountSchema.nullable(),
    available: z.number().int().nonnegative(),
    editions: z.array(
      z.object({
        id: idSchema,
        price: ethAmountSchema,
        available: z.number().int().nonnegative(),
      }),
    ),
  }),
})
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = z.object({
  ...eventBase,
  type: z.literal(realtimeEventNames.orderUpdated),
  userId: idSchema,
  resource: z.object({ type: z.literal('order'), id: idSchema }),
  data: z.object({
    status: orderStatusSchema,
    transactionHash: z.string().nullable(),
    explorerUrl: z.string().nullable(),
    declineReason: z.string().nullable(),
  }),
})
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent
