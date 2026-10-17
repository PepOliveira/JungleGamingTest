import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Network } from '@/contracts/common'
import type { CreateOrderRequest } from '@/contracts/order'
import type { Quote } from '@/contracts/quote'
import { useSession } from '@/features/auth/use-session'
import { toApiError } from '@/shared/api/api-error'
import { connectWallet, createOrder, createQuote, disconnectWallet } from './api/checkout-api'
import { checkoutFingerprint, getAttemptKey } from './checkout-attempt'
import { savePendingOrderId } from './pending-order'

const MAX_SUBMIT_RETRIES = 2
const QUOTE_STALE_MS = 90_000

export const quoteKey = (userId: string, network: Network) =>
  ['cart', userId, 'quote', network] as const

export function useCheckoutQuote(network: Network | null) {
  const session = useSession()
  const userId = session.user?.id ?? ''

  return useQuery({
    queryKey: quoteKey(userId, network ?? 'ethereum'),
    queryFn: ({ signal }) => createQuote(network ?? 'ethereum', signal),
    enabled: session.user !== null && network !== null,
    staleTime: QUOTE_STALE_MS,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useReplaceQuote() {
  const queryClient = useQueryClient()
  const session = useSession()
  const userId = session.user?.id ?? ''

  return (quote: Quote) => {
    queryClient.setQueryData(quoteKey(userId, quote.network), quote)
  }
}

export function useConnectWallet() {
  return useMutation({ mutationFn: connectWallet })
}

export function useDisconnectWallet() {
  return useMutation({ mutationFn: disconnectWallet })
}

export type SubmitOrderVariables = {
  quote: Quote
  walletId: string
  connectionId: string
  fullName: string
  email: string
  note: string
}

export function useSubmitOrder() {
  const session = useSession()
  const userId = session.user?.id ?? ''

  return useMutation({
    scope: { id: 'checkout' },
    retry: (failureCount, error) =>
      toApiError(error).retryable && failureCount < MAX_SUBMIT_RETRIES,
    retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 4000),
    mutationFn: ({
      quote,
      walletId,
      connectionId,
      fullName,
      email,
      note,
    }: SubmitOrderVariables) => {
      const body: CreateOrderRequest = {
        quoteId: quote.id,
        walletId,
        connectionId,
        network: quote.network,
        collector: { fullName, email },
        ...(note ? { note } : {}),
      }
      const key = getAttemptKey(
        checkoutFingerprint({ quoteId: quote.id, walletId, connectionId, fullName, email, note }),
      )
      return createOrder(body, key)
    },
    onSuccess: (order) => {
      savePendingOrderId(userId, order.id)
    },
  })
}
