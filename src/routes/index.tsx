import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import {
  featuredNftsQueryOptions,
  nftListQueryOptions,
} from '@/features/catalog/api/catalog-queries'
import { CatalogPage } from '@/features/catalog/components/catalog-page'
import {
  catalogSearchDefaults,
  catalogSearchSchema,
  normalizeCatalogSearch,
  toListQuery,
} from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(catalogSearchDefaults)] },
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    const query = toListQuery(normalizeCatalogSearch(deps.search))
    void context.queryClient.prefetchQuery(nftListQueryOptions(query))
    void context.queryClient.prefetchQuery(featuredNftsQueryOptions())
  },
  component: CatalogPage,
})
