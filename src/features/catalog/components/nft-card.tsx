import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/contracts/nft'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { formatEthWithSymbol } from '@/shared/lib/eth'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'
import { ResponsiveImage } from '@/shared/ui/responsive-image'

type NftCardProps = {
  nft: NftSummary
  priority?: boolean
  className?: string
}

const IMAGE_SIZES = '(min-width: 1024px) 260px, (min-width: 768px) 30vw, 46vw'

export function NftCard({ nft, priority = false, className }: NftCardProps) {
  const soldOut = nft.available === 0

  return (
    <li className={cn('relative flex flex-col', className)}>
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="group flex flex-col gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative overflow-hidden rounded-xl bg-card p-3">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-canvas">
            <ResponsiveImage
              image={nft.image}
              sizes={IMAGE_SIZES}
              priority={priority}
              className="transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
            />
          </div>
          {nft.rarity === 'rare' ? (
            <span className="absolute top-6 left-3 bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
              RARO
            </span>
          ) : null}
          {soldOut ? (
            <span className="absolute bottom-6 left-6 rounded-sm bg-background/90 px-2 py-1 text-xs font-bold text-foreground">
              ESGOTADO
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1 px-1">
          <h3 className="text-sm text-foreground">{nft.name}</h3>
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-bold text-primary-bright">
            <span>{formatEthWithSymbol(nft.price)}</span>
            {nft.originalPrice ? (
              <span className="font-normal text-muted-foreground line-through">
                <span className="sr-only">Preço original </span>
                {formatEthWithSymbol(nft.originalPrice)}
              </span>
            ) : null}
          </p>
        </div>
      </Link>
      <FavoriteButton nft={nft} className="absolute top-6 right-6" />
    </li>
  )
}

export function NftCardSkeleton({ className }: { className?: string }) {
  return (
    <li className={cn('flex flex-col gap-3', className)} aria-hidden="true">
      <div className="rounded-xl bg-card p-3">
        <Skeleton className="aspect-square rounded-lg bg-secondary" />
      </div>
      <div className="flex flex-col gap-2 px-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </li>
  )
}
