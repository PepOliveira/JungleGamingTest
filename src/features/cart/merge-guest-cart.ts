import type { QueryClient } from '@tanstack/react-query'
import { mergeGuestCart } from './api/cart-api'

export async function mergeGuestCartIntoUser(queryClient: QueryClient) {
  try {
    await mergeGuestCart()
  } finally {
    await queryClient.invalidateQueries({ queryKey: ['cart'] })
  }
}
