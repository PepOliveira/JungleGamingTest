import { createFileRoute } from '@tanstack/react-router'
import { requireAuthenticated } from '@/features/auth/guards'
import { OrderPage } from '@/features/orders/components/order-page'

export const Route = createFileRoute('/pedido/$orderId')({
  beforeLoad: requireAuthenticated,
  component: OrderPage,
})
