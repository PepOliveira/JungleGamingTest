import { z } from 'zod'
import { ethAmountSchema, idSchema, imageSchema, quantitySchema, versionSchema } from './common'

export const cartItemSchema = z.object({
  id: idSchema,
  nftId: idSchema,
  editionId: idSchema,
  name: z.string(),
  editionLabel: z.string(),
  image: imageSchema,
  quantity: quantitySchema,
  unitPrice: ethAmountSchema,
  available: z.number().int().nonnegative(),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  id: idSchema,
  items: z.array(cartItemSchema),
  couponCode: z.string().nullable(),
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

export const mergeCartRequestSchema = z.object({
  items: z.array(addCartItemRequestSchema),
})
export type MergeCartRequest = z.infer<typeof mergeCartRequestSchema>

export const applyCouponRequestSchema = z.object({
  code: z.string().trim().min(1).max(32),
})
export type ApplyCouponRequest = z.infer<typeof applyCouponRequestSchema>
