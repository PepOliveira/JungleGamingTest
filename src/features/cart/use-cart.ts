import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Cart } from '@/contracts/cart'
import { useSession } from '@/features/auth/use-session'
import { toApiError } from '@/shared/api/api-error'
import { announce } from '@/shared/lib/announcer'
import {
  addCartItem,
  applyCartCoupon,
  removeCartCoupon,
  removeCartItem,
  updateCartItem,
} from './api/cart-api'
import { cartKey, cartQueryOptions } from './api/cart-queries'

function useOwnerKey() {
  const session = useSession()
  return { ownerKey: session.user?.id ?? 'guest', ready: session.status !== 'loading' }
}

export function useCart() {
  const { ownerKey, ready } = useOwnerKey()
  return useQuery({ ...cartQueryOptions(ownerKey), enabled: ready })
}

export function useCartCount() {
  const { data } = useCart()
  return data ? data.items.reduce((total, item) => total + item.quantity, 0) : 0
}

type CartMutationOptions<TVariables> = {
  mutationFn: (variables: TVariables) => Promise<Cart>
  successMessage?: (cart: Cart, variables: TVariables) => string
  silentErrors?: boolean
}

function useCartMutation<TVariables>({
  mutationFn,
  successMessage,
  silentErrors = false,
}: CartMutationOptions<TVariables>) {
  const queryClient = useQueryClient()
  const { ownerKey } = useOwnerKey()

  return useMutation({
    scope: { id: 'cart' },
    mutationFn,
    onSuccess: (cart, variables) => {
      queryClient.setQueryData(cartKey(ownerKey), cart)
      if (successMessage) {
        announce(successMessage(cart, variables), { visible: true })
      }
    },
    onError: (error) => {
      if (!silentErrors) {
        announce(toApiError(error).message, { visible: true, tone: 'error' })
      }
    },
  })
}

type AddVariables = { nftId: string; editionId: string; quantity: number; label?: string }

export function useAddToCart() {
  return useCartMutation<AddVariables>({
    mutationFn: ({ nftId, editionId, quantity }) => addCartItem({ nftId, editionId, quantity }),
    successMessage: (_cart, { label }) =>
      label ? `${label} adicionado ao carrinho` : 'Item adicionado ao carrinho',
  })
}

export function useUpdateCartItem() {
  return useCartMutation<{ itemId: string; quantity: number }>({
    mutationFn: ({ itemId, quantity }) => updateCartItem(itemId, quantity),
  })
}

export function useRemoveCartItem() {
  return useCartMutation<{ itemId: string; label: string }>({
    mutationFn: ({ itemId }) => removeCartItem(itemId),
    successMessage: (_cart, { label }) => `${label} removido do carrinho`,
  })
}

export function useApplyCoupon() {
  return useCartMutation<string>({
    mutationFn: applyCartCoupon,
    successMessage: (cart) => `Cupom ${cart.couponCode ?? ''} aplicado`.trim(),
    silentErrors: true,
  })
}

export function useRemoveCoupon() {
  return useCartMutation<void>({
    mutationFn: removeCartCoupon,
    successMessage: () => 'Cupom removido',
  })
}
