import { createRootRoute } from '@tanstack/react-router'
import { AppShell } from '@/shared/layout/app-shell'
import { StatusPage } from '@/shared/layout/status-page'

export const Route = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <StatusPage
      code="404"
      title="Página não encontrada"
      description="O endereço que você tentou acessar não existe ou foi movido."
    />
  ),
})
