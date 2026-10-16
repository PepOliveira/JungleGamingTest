import { createFileRoute } from '@tanstack/react-router'
import { StatusPage } from '@/shared/layout/status-page'

type UnavailableSearch = {
  secao?: string
}

export const Route = createFileRoute('/indisponivel')({
  validateSearch: (search: Record<string, unknown>): UnavailableSearch => ({
    secao: typeof search.secao === 'string' ? search.secao : undefined,
  }),
  component: UnavailablePage,
})

function UnavailablePage() {
  return (
    <StatusPage
      title="Seção indisponível"
      description="Esta área não faz parte desta versão do marketplace."
    />
  )
}
