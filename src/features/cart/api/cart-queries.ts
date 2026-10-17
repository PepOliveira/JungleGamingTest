import { queryOptions } from '@tanstack/react-query'
import { fetchCart } from './cart-api'

export const cartKey = (ownerKey: string) => ['cart', ownerKey] as const

export function cartQueryOptions(ownerKey: string) {
  return queryOptions({
    queryKey: cartKey(ownerKey),
    queryFn: ({ signal }) => fetchCart(signal),
    staleTime: 30_000,
  })
}
