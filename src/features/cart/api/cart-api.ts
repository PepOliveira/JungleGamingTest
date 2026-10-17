import { cartSchema } from '@/contracts/cart'
import type { AddCartItemRequest } from '@/contracts/cart'
import { endpoints, GUEST_CART_HEADER } from '@/contracts/endpoints'
import { apiRequest } from '@/shared/api/request'
import { getGuestCartToken } from '../guest-token'

function cartHeaders() {
  return { [GUEST_CART_HEADER]: getGuestCartToken() }
}

export function fetchCart(signal?: AbortSignal) {
  return apiRequest({ url: endpoints.cart.root, headers: cartHeaders(), signal }, cartSchema)
}

export function addCartItem(body: AddCartItemRequest) {
  return apiRequest(
    { method: 'POST', url: endpoints.cart.items, headers: cartHeaders(), data: body },
    cartSchema,
  )
}

export function updateCartItem(itemId: string, quantity: number) {
  return apiRequest(
    {
      method: 'PATCH',
      url: endpoints.cart.item(itemId),
      headers: cartHeaders(),
      data: { quantity },
    },
    cartSchema,
  )
}

export function removeCartItem(itemId: string) {
  return apiRequest(
    { method: 'DELETE', url: endpoints.cart.item(itemId), headers: cartHeaders() },
    cartSchema,
  )
}

export function applyCartCoupon(code: string) {
  return apiRequest(
    { method: 'PUT', url: endpoints.cart.coupon, headers: cartHeaders(), data: { code } },
    cartSchema,
  )
}

export function removeCartCoupon() {
  return apiRequest(
    { method: 'DELETE', url: endpoints.cart.coupon, headers: cartHeaders() },
    cartSchema,
  )
}

export function mergeGuestCart() {
  return apiRequest(
    { method: 'POST', url: endpoints.cart.merge, headers: cartHeaders() },
    cartSchema,
  )
}
