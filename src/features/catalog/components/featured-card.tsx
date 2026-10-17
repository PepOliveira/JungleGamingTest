import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ResponsiveImage } from '@/shared/ui/responsive-image'
import { Skeleton } from '@/shared/ui/skeleton'
import { featuredNftsQueryOptions } from '../api/catalog-queries'

export function FeaturedCard() {
  const { data, isPending } = useQuery(featuredNftsQueryOptions())
  const nft = data?.items.find((item) => item.originalPrice !== null) ?? data?.items[0]

  return (
    <section aria-labelledby="featured-title" className="overflow-hidden rounded-xl bg-card">
      <div className="px-4 pt-4 pb-3">
        <h2 id="featured-title" className="text-lg font-bold text-primary uppercase">
          NFT em destaque
        </h2>
        <p className="mt-2 text-sm font-bold">OFERTA LIMITADA</p>
      </div>
      {isPending || !nft ? (
        <Skeleton className="aspect-square rounded-none bg-secondary" />
      ) : (
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          aria-label={`Ver ${nft.name}`}
          className="block aspect-square overflow-hidden bg-canvas outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ResponsiveImage image={nft.image} sizes="260px" />
        </Link>
      )}
    </section>
  )
}
