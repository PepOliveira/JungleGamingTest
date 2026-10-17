import { createFileRoute } from '@tanstack/react-router'
import { AccountLayout } from '@/features/account/account-layout'
import { requireAuthenticated } from '@/features/auth/guards'

export const Route = createFileRoute('/perfil')({
  beforeLoad: requireAuthenticated,
  component: AccountLayout,
})
