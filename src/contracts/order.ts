import { z } from 'zod'
import {
  ethAmountSchema,
  idSchema,
  isoDateSchema,
  networkSchema,
  quantitySchema,
  versionSchema,
} from './common'
import { walletProviderSchema } from './wallet'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'declined'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderItemSchema = z.object({
  nftId: idSchema,
  editionId: idSchema,
  name: z.string(),
  tokenId: z.string(),
  editionLabel: z.string(),
  imageUrl: z.string(),
  quantity: quantitySchema,
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
})
export type OrderItem = z.infer<typeof orderItemSchema>

export const orderSchema = z.object({
  id: idSchema,
  status: orderStatusSchema,
  network: networkSchema,
  walletLabel: z.string(),
  walletProvider: walletProviderSchema,
  walletAddress: z.string(),
  collector: z.object({ fullName: z.string(), email: z.email() }),
  note: z.string().nullable(),
  items: z.array(orderItemSchema),
  couponCode: z.string().nullable(),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  transactionHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  declineReason: z.string().nullable(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  version: versionSchema,
})
export type Order = z.infer<typeof orderSchema>

export const createOrderRequestSchema = z.object({
  quoteId: idSchema,
  walletId: idSchema,
  connectionId: idSchema,
  network: networkSchema,
  collector: z.object({
    fullName: z
      .string()
      .trim()
      .min(2, 'O nome de exibição deve ter ao menos 2 caracteres')
      .max(80, 'O nome de exibição deve ter até 80 caracteres'),
    email: z.email('Informe um e-mail válido'),
  }),
  note: z.string().trim().max(500, 'A observação deve ter até 500 caracteres').optional(),
})
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>

export const ordersResponseSchema = z.object({
  items: z.array(orderSchema),
})
export type OrdersResponse = z.infer<typeof ordersResponseSchema>

export const orderListQuerySchema = z.object({
  status: orderStatusSchema.optional(),
})
export type OrderListQuery = z.infer<typeof orderListQuerySchema>
