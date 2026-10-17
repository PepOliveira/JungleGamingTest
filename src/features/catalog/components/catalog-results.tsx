import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'
import { toApiError } from '@/shared/api/api-error'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/error-state'
import { CATALOG_PAGE_SIZE, hasActiveFilters } from '../search'
import { useCatalogFilters, useNftList } from '../use-catalog-filters'
import { CatalogPagination } from './catalog-pagination'
import { NftCard, NftCardSkeleton } from './nft-card'

const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-6 max-md:[&>li:nth-child(even)]:mt-10 md:grid-cols-3 lg:gap-x-6 lg:gap-y-8'

export function CatalogResults() {
  const { search, clearAll } = useCatalogFilters()
  const query = useNftList()

  if (query.isPending) {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          Carregando NFTs
        </p>
        <ul className={gridClass}>
          {Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => (
            <NftCardSkeleton key={index} />
          ))}
        </ul>
      </div>
    )
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar os NFTs"
        description={toApiError(query.error).message}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    )
  }

  const { items, pagination } = query.data
  const refreshing = query.isFetching

  if (items.length === 0) {
    const beyondLastPage = pagination.total > 0
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
        <SearchX className="size-8 text-primary" aria-hidden="true" />
        <h3 className="text-base font-bold">
          {beyondLastPage ? 'Esta página não existe' : 'Nenhum NFT encontrado'}
        </h3>
        <p role="status" className="max-w-sm text-sm text-muted-foreground">
          {beyondLastPage
            ? 'O catálogo tem menos páginas do que a solicitada.'
            : 'Ajuste a busca ou os filtros para ver mais resultados.'}
        </p>
        {beyondLastPage ? (
          <Button asChild size="lg">
            <Link to="/" search={(previous) => ({ ...previous, page: 1 })} resetScroll={false}>
              Voltar à primeira página
            </Link>
          </Button>
        ) : hasActiveFilters(search) ? (
          <Button size="lg" onClick={() => void clearAll()}>
            Limpar filtros
          </Button>
        ) : null}
      </div>
    )
  }

  const first = (pagination.page - 1) * pagination.pageSize + 1
  const last = first + items.length - 1

  return (
    <div aria-busy={refreshing}>
      <p role="status" className="mb-4 text-xs text-muted-foreground max-md:sr-only">
        {refreshing
          ? 'Atualizando resultados...'
          : `Mostrando ${first}–${last} de ${pagination.total} NFTs`}
      </p>
      <ul className={cn(gridClass, 'transition-opacity', refreshing && 'opacity-60')}>
        {items.map((nft, index) => (
          <NftCard key={nft.id} nft={nft} priority={index < 3} />
        ))}
      </ul>
      <CatalogPagination page={pagination.page} totalPages={pagination.totalPages} />
    </div>
  )
}
