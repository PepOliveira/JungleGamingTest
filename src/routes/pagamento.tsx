import { createFileRoute, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/features/auth/api/auth-queries'
import { requireAuthenticated } from '@/features/auth/guards'
import { CheckoutPage } from '@/features/checkout/components/checkout-page'
import { readPendingOrderId } from '@/features/checkout/pending-order'

export const Route = createFileRoute('/pagamento')({
  beforeLoad: async (args) => {
    await requireAuthenticated(args)

    const session = await args.context.queryClient.ensureQueryData(sessionQueryOptions())
    const pendingOrderId = readPendingOrderId(session.user.id)
    if (pendingOrderId) {
      throw redirect({ to: '/pedido/$orderId', params: { orderId: pendingOrderId }, replace: true })
    }
  },
  component: CheckoutPage,
})
