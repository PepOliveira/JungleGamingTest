import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useRouter, useSearch } from '@tanstack/react-router'
import { ChevronLeft, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import type { NftDetail } from '@/contracts/nft'
import { useAddToCart } from '@/features/cart/use-cart'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { toApiError } from '@/shared/api/api-error'
import { ethMultiply, formatEthWithSymbol } from '@/shared/lib/eth'
import { StatusPage } from '@/shared/layout/status-page'
import { UnavailableLink } from '@/shared/layout/unavailable-link'
import { Button } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/error-state'
import { nftDetailQueryOptions } from '../api/nft-detail-queries'
import { resolveSelection } from '../edition-selection'
import { EditionPicker } from './edition-picker'
import { NftDetailSkeleton } from './nft-detail-skeleton'
import { NftDetailsTabs } from './nft-details-tabs'
import { NftGallery } from './nft-gallery'
import { QuantityStepper } from './quantity-stepper'
import { RelatedNfts } from './related-nfts'
import { ShareLinks } from './share-links'
import { RatingBadge, StarRating } from './star-rating'

const containerClass = 'mx-auto w-full max-w-[1248px] pb-40 lg:px-6 lg:pb-12'

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const query = useQuery(nftDetailQueryOptions(nftId))

  if (query.isPending) {
    return (
      <div className={`${containerClass} lg:pt-10`}>
        <NftDetailSkeleton />
      </div>
    )
  }

  if (query.isError) {
    const error = toApiError(query.error)
    if (error.kind === 'not_found') {
      return (
        <StatusPage
          code="404"
          title="NFT não encontrado"
          description="Este NFT não existe ou deixou de estar disponível no catálogo."
        />
      )
    }
    return (
      <div className={`${containerClass} px-4 pt-10`}>
        <ErrorState
          title="Não foi possível carregar este NFT"
          description={error.message}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      </div>
    )
  }

  return (
    <div className={`${containerClass} lg:pt-6`}>
      <NftDetailContent nft={query.data} />
    </div>
  )
}

type NftDetailContentProps = {
  nft: NftDetail
}

function NftDetailContent({ nft }: NftDetailContentProps) {
  const { edicao } = useSearch({ from: '/nfts/$nftId' })
  const navigate = useNavigate({ from: '/nfts/$nftId' })
  const router = useRouter()
  const routerNavigate = router.navigate
  const [requestedQuantity, setRequestedQuantity] = useState(1)

  const { edition, quantity, maxQuantity, soldOut } = resolveSelection(
    nft.editions,
    edicao,
    requestedQuantity,
    nft.defaultEditionId,
  )
  const unitPrice = edition?.price ?? nft.price
  const total = edition ? ethMultiply(edition.price, quantity) : null
  const showOriginalPrice = nft.originalPrice !== null && edition?.id === nft.defaultEditionId

  const addToCart = useAddToCart()
  const canAdd = Boolean(edition) && !soldOut && !addToCart.isPending

  function addSelection(onAdded: () => void) {
    if (!edition) return
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity, label: nft.name },
      { onSuccess: onAdded },
    )
  }

  function handleBuyNow() {
    addSelection(() => void routerNavigate({ to: '/carrinho' }))
  }

  function handleAddOnly() {
    addSelection(() => undefined)
  }

  function selectEdition(editionId: string) {
    setRequestedQuantity(1)
    void navigate({ search: { edicao: editionId }, replace: true, resetScroll: false })
  }

  const stepper = (showLabel: boolean) => (
    <QuantityStepper
      value={quantity}
      max={Math.max(maxQuantity, 1)}
      disabled={soldOut}
      showLabel={showLabel}
      onChange={setRequestedQuantity}
    />
  )

  return (
    <article>
      <nav aria-label="Você está em" className="mb-4 hidden text-xs font-bold lg:block">
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
        </ol>
      </nav>

      <div className="relative">
        <div className="absolute inset-x-6 top-5 z-10 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => router.history.back()}
            className="flex size-10 items-center justify-center rounded-full bg-card/80 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
            <span className="sr-only">Voltar</span>
          </button>
          <FavoriteButton nft={nft} className="size-10 rounded-full bg-card/80" />
        </div>

        <div className="grid lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-10">
          <NftGallery images={nft.gallery} />

          <div className="relative -mt-10 flex flex-col gap-5 rounded-t-[2rem] bg-card px-6 pt-7 pb-8 lg:mt-0 lg:rounded-none lg:bg-transparent lg:p-0">
            <div className="flex items-start justify-between gap-3 lg:block">
              <h1 className="text-xl font-bold lg:text-3xl">{nft.name}</h1>
              <div className="lg:hidden">
                <RatingBadge average={nft.rating.average} count={nft.rating.count} />
              </div>
            </div>

            <div className="hidden items-baseline justify-between gap-4 border-b border-border pb-3 lg:flex">
              <p className="flex items-baseline gap-3 text-2xl font-bold text-primary-bright">
                <span>{formatEthWithSymbol(unitPrice)}</span>
                {showOriginalPrice && nft.originalPrice ? (
                  <span className="text-sm font-normal text-muted-foreground line-through">
                    <span className="sr-only">Preço original </span>
                    {formatEthWithSymbol(nft.originalPrice)}
                  </span>
                ) : null}
              </p>
              <StarRating average={nft.rating.average} count={nft.rating.count} />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="hidden text-sm font-bold lg:block">Sobre este NFT:</h2>
              <p className="text-sm leading-relaxed text-warm">{nft.summary}</p>
            </div>

            <EditionPicker
              editions={nft.editions}
              selectedId={edition?.id ?? null}
              onSelect={selectEdition}
            />

            {soldOut ? (
              <p
                role="status"
                className="rounded-xl border border-border bg-secondary p-4 text-sm text-muted-foreground"
              >
                Todas as edições deste NFT estão esgotadas.
              </p>
            ) : null}

            <div className="hidden items-start justify-between gap-4 lg:flex">
              {stepper(false)}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  disabled={!canAdd}
                  onClick={handleBuyNow}
                  className="h-10 px-8 font-bold uppercase"
                >
                  Comprar
                </Button>
                <FavoriteButton nft={nft} variant="labeled" />
              </div>
            </div>

            <dl className="flex flex-col gap-2 text-sm text-warm/80">
              <div className="flex gap-1">
                <dt>ID do token:</dt>
                <dd>{nft.tokenId}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Coleção:</dt>
                <dd>{nft.collectionName}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Atributos:</dt>
                <dd>{nft.attributes.join(', ')}</dd>
              </div>
            </dl>

            <div className="hidden lg:block">
              <ShareLinks title={nft.name} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-16 px-4 lg:mt-16 lg:px-0">
        <NftDetailsTabs nft={nft} />
        <RelatedNfts nftId={nft.id} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[2rem] bg-card px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.4)] lg:hidden">
        <div className="flex items-start justify-between gap-4">
          {stepper(true)}
          <p className="pt-1 text-xl font-bold text-primary-bright">
            <span className="sr-only">Total </span>
            {total ? formatEthWithSymbol(total) : formatEthWithSymbol(unitPrice)}
          </p>
        </div>
        <div className="mt-3 flex gap-3">
          <Button
            size="lg"
            disabled={!canAdd}
            onClick={handleBuyNow}
            className="h-[60px] w-[196px] flex-none rounded-full bg-gradient-to-b from-[#eaaa72] to-[#c98b55] text-base font-bold"
          >
            Comprar NFT
          </Button>
          <button
            type="button"
            disabled={!canAdd}
            onClick={handleAddOnly}
            className="flex size-[60px] items-center justify-center rounded-full border border-border bg-background/40 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <ShoppingCart className="size-5 text-primary" aria-hidden="true" />
            <span className="sr-only">Adicionar ao carrinho</span>
          </button>
        </div>
      </div>
    </article>
  )
}
