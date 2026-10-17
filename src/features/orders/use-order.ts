import { queryOptions, useQuery } from '@tanstack/react-query'
import { fetchOrder } from '@/features/checkout/api/checkout-api'
import { useSession } from '@/features/auth/use-session'

const POLL_INTERVAL_MS = 1500

export const orderKey = (userId: string, orderId: string) => ['orders', userId, orderId] as const

export function orderQueryOptions(userId: string, orderId: string) {
  return queryOptions({
    queryKey: orderKey(userId, orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? POLL_INTERVAL_MS : false),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  })
}

export function useOrder(orderId: string) {
  const session = useSession()
  const userId = session.user?.id ?? ''
  return useQuery({ ...orderQueryOptions(userId, orderId), enabled: session.user !== null })
}
