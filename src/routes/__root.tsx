import { createRootRouteWithContext } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router-context'
import { AuthDialog } from '@/features/auth/components/auth-dialog'
import { HeaderAccount } from '@/features/auth/components/header-account'
import { MobileProfileTab } from '@/features/auth/components/mobile-profile-tab'
import { authSearchSchema } from '@/features/auth/search'
import { SearchDialog } from '@/features/catalog/components/search-dialog'
import { AppShell } from '@/shared/layout/app-shell'
import { StatusPage } from '@/shared/layout/status-page'

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: authSearchSchema,
  component: RootLayout,
  notFoundComponent: () => (
    <StatusPage
      code="404"
      title="Página não encontrada"
      description="O endereço que você tentou acessar não existe ou foi movido."
    />
  ),
})

function RootLayout() {
  return (
    <AppShell
      headerSearch={<SearchDialog />}
      headerAccount={<HeaderAccount />}
      mobileProfile={<MobileProfileTab />}
      overlays={<AuthDialog />}
    />
  )
}
