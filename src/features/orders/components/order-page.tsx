import { useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSession } from '@/features/auth/use-session'
import { clearAttempt } from '@/features/checkout/checkout-attempt'
import { clearPendingOrderId } from '@/features/checkout/pending-order'
import { toApiError } from '@/shared/api/api-error'
import { announce } from '@/shared/lib/announcer'
import { StatusPage } from '@/shared/layout/status-page'
import { ErrorState } from '@/shared/ui/error-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { useOrder } from '../use-order'
import { OrderDeclinedCard, OrderPendingCard } from './order-status-cards'
import { OrderReceipt } from './order-receipt'

const wrapperClass = 'mx-auto w-full max-w-[1200px] px-4 py-10 pb-32 lg:px-6 lg:py-16'

export function OrderPage() {
  const { orderId } = useParams({ from: '/pedido/$orderId' })
  const queryClient = useQueryClient()
  const session = useSession()
  const query = useOrder(orderId)
  const status = query.data?.status
  const userId = session.user?.id

  useEffect(() => {
    if (!userId || !status || status === 'pending') {
      return
    }
    clearPendingOrderId(userId, orderId)
    clearAttempt()
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    void queryClient.invalidateQueries({ queryKey: ['nfts'] })
    announce(status === 'confirmed' ? 'Pedido confirmado' : 'Pagamento recusado', {
      visible: status === 'declined',
      tone: 'error',
    })
  }, [status, orderId, userId, queryClient])

  if (query.isPending) {
    return (
      <div className={wrapperClass}>
        <div aria-busy="true" className="mx-auto max-w-[580px]">
          <p role="status" className="sr-only">
            Carregando pedido
          </p>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (query.isError) {
    const error = toApiError(query.error)
    if (error.kind === 'not_found') {
      return (
        <StatusPage
          code="404"
          title="Pedido não encontrado"
          description="Este pedido não existe ou não pertence à sua conta."
        />
      )
    }
    return (
      <div className={wrapperClass}>
        <div className="mx-auto max-w-[580px]">
          <ErrorState
            title="Não foi possível carregar o pedido"
            description={error.message}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        </div>
      </div>
    )
  }

  const order = query.data

  return (
    <div className={wrapperClass}>
      {order.status === 'confirmed' ? (
        <OrderReceipt order={order} />
      ) : order.status === 'declined' ? (
        <OrderDeclinedCard order={order} />
      ) : (
        <OrderPendingCard order={order} />
      )}
    </div>
  )
}
