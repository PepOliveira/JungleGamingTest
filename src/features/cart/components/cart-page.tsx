import { useQuery } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { NftCarousel } from '@/features/catalog/components/nft-carousel'
import { nftListQueryOptions } from '@/features/catalog/api/catalog-queries'
import { UnavailableLink } from '@/shared/layout/unavailable-link'
import { toApiError } from '@/shared/api/api-error'
import { ErrorState } from '@/shared/ui/error-state'
import { useCart } from '../use-cart'
import { CartItemRow } from './cart-item-row'
import { CartSkeleton } from './cart-skeleton'
import { CartSummary } from './cart-summary'
import { EmptyCart } from './empty-cart'

const suggestionsQuery = nftListQueryOptions({
  collections: [],
  networks: [],
  tab: 'trending',
  sort: 'recent',
  page: 1,
  pageSize: 12,
})

function CartSuggestions() {
  const { data } = useQuery(suggestionsQuery)

  return (
    <NftCarousel
      title="Colecionadores também viram"
      titleId="cart-suggestions-title"
      pagesLabel="Páginas de sugestões"
      items={data?.items}
    />
  )
}

export function CartPage() {
  const router = useRouter()
  const query = useCart()

  const header = (
    <>
      <div className="relative flex items-center justify-center pt-5 pb-5 lg:hidden">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="absolute left-0 flex size-10 items-center justify-center rounded-full bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          <span className="sr-only">Voltar</span>
        </button>
        <p aria-hidden="true" className="text-lg font-bold">
          Carrinho de NFTs
        </p>
      </div>
      <nav aria-label="Você está em" className="mb-1 hidden text-xs font-bold lg:block">
        <ol className="flex items-center gap-1">
          <li>
            <Link to="/" className="rounded-sm hover:text-primary">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <UnavailableLink secao="mercado" className="rounded-sm hover:text-primary">
              Mercado
            </UnavailableLink>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Carrinho</li>
        </ol>
      </nav>
    </>
  )

  if (query.isPending) {
    return (
      <div className="mx-auto w-full max-w-[1248px] px-7 pb-10 lg:px-6 lg:pt-8">
        {header}
        <h1 className="sr-only">Carrinho de NFTs</h1>
        <CartSkeleton />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="mx-auto w-full max-w-[1248px] px-7 pb-10 lg:px-6 lg:pt-8">
        {header}
        <h1 className="sr-only">Carrinho de NFTs</h1>
        <ErrorState
          title="Não foi possível carregar o carrinho"
          description={toApiError(query.error).message}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      </div>
    )
  }

  const cart = query.data
  const hasBlockingItems = cart.items.some((item) => item.quantity > item.available)

  return (
    <div className="mx-auto w-full max-w-[1248px] px-7 pb-[26rem] lg:px-6 lg:pt-8 lg:pb-12">
      {header}
      <h1 className="sr-only">Carrinho de NFTs</h1>

      {cart.items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-[86px]">
          <section aria-label="Itens do carrinho">
            <div
              aria-hidden="true"
              className="mb-3 hidden grid-cols-[311px_139px_136px_minmax(0,1fr)_40px] border-b border-border pb-3 text-sm lg:grid"
            >
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
              <span />
            </div>
            <ul className="flex flex-col gap-3">
              {cart.items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </ul>
          </section>

          <aside
            aria-label="Resumo da carteira"
            className="fixed inset-x-0 bottom-0 z-40 rounded-t-[2rem] bg-card px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.4)] lg:static lg:z-auto lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none"
          >
            <h2 className="mb-4 hidden border-b border-border pb-3 text-base font-bold lg:block">
              Resumo da carteira
            </h2>
            <CartSummary cart={cart} hasBlockingItems={hasBlockingItems} />
          </aside>
        </div>
      )}

      <div className="mt-16 lg:mt-24">
        <CartSuggestions />
      </div>
    </div>
  )
}
