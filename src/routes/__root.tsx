import { createRootRouteWithContext } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router-context'
import { SearchDialog } from '@/features/catalog/components/search-dialog'
import { AppShell } from '@/shared/layout/app-shell'
import { StatusPage } from '@/shared/layout/status-page'

export const Route = createRootRouteWithContext<RouterContext>()({
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
  return <AppShell headerSearch={<SearchDialog />} />
}
