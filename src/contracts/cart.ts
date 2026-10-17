import { z } from 'zod'
import { ethAmountSchema, idSchema, imageSchema, quantitySchema, versionSchema } from './common'

export const MAX_QUANTITY_PER_ITEM = 10

export const cartItemSchema = z.object({
  id: idSchema,
  nftId: idSchema,
  editionId: idSchema,
  name: z.string(),
  tokenId: z.string(),
  editionLabel: z.string(),
  image: imageSchema,
  quantity: quantitySchema,
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
  available: z.number().int().nonnegative(),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSummarySchema = z.object({
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
})
export type CartSummary = z.infer<typeof cartSummarySchema>

export const cartSchema = z.object({
  id: idSchema,
  items: z.array(cartItemSchema),
  couponCode: z.string().nullable(),
  summary: cartSummarySchema,
  version: versionSchema,
})
export type Cart = z.infer<typeof cartSchema>

export const addCartItemRequestSchema = z.object({
  nftId: idSchema,
  editionId: idSchema,
  quantity: quantitySchema,
})
export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>

export const updateCartItemRequestSchema = z.object({
  quantity: quantitySchema,
})
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>

export const applyCouponRequestSchema = z.object({
  code: z.string().trim().min(1, 'Informe o código promocional').max(32),
})
export type ApplyCouponRequest = z.infer<typeof applyCouponRequestSchema>
