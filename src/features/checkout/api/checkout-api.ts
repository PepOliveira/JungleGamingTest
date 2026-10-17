import type { Network } from '@/contracts/common'
import { endpoints } from '@/contracts/endpoints'
import { orderSchema } from '@/contracts/order'
import type { CreateOrderRequest } from '@/contracts/order'
import { quoteSchema } from '@/contracts/quote'
import { walletConnectionSchema } from '@/contracts/wallet'
import type { CreateWalletConnectionRequest } from '@/contracts/wallet'
import { apiCommand, apiRequest, withIdempotencyKey } from '@/shared/api/request'

export function createQuote(network: Network, signal?: AbortSignal) {
  return apiRequest(
    { method: 'POST', url: endpoints.quotes.create, data: { network }, signal },
    quoteSchema,
  )
}

export function connectWallet(body: CreateWalletConnectionRequest) {
  return apiRequest(
    { method: 'POST', url: endpoints.walletConnections.create, data: body },
    walletConnectionSchema,
  )
}

export function disconnectWallet(connectionId: string) {
  return apiCommand({ method: 'DELETE', url: endpoints.walletConnections.detail(connectionId) })
}

export function createOrder(body: CreateOrderRequest, idempotencyKey: string) {
  return apiRequest(
    withIdempotencyKey(
      { method: 'POST', url: endpoints.orders.create, data: body },
      idempotencyKey,
    ),
    orderSchema,
  )
}

export function fetchOrder(orderId: string, signal?: AbortSignal) {
  return apiRequest({ url: endpoints.orders.detail(orderId), signal }, orderSchema)
}
