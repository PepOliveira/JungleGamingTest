import { z } from 'zod'
import {
  ethAmountSchema,
  idSchema,
  isoDateSchema,
  networkSchema,
  quantitySchema,
  versionSchema,
} from './common'

export const quoteItemSchema = z.object({
  nftId: idSchema,
  editionId: idSchema,
  name: z.string(),
  editionLabel: z.string(),
  quantity: quantitySchema,
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
  available: z.number().int().nonnegative(),
})
export type QuoteItem = z.infer<typeof quoteItemSchema>

export const quoteSchema = z.object({
  id: idSchema,
  cartVersion: versionSchema,
  network: networkSchema,
  items: z.array(quoteItemSchema),
  couponCode: z.string().nullable(),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  issuedAt: isoDateSchema,
  expiresAt: isoDateSchema,
})
export type Quote = z.infer<typeof quoteSchema>

export const createQuoteRequestSchema = z.object({
  network: networkSchema,
})
export type CreateQuoteRequest = z.infer<typeof createQuoteRequestSchema>
