import { useQuery } from '@tanstack/react-query'
import { NftCarousel } from '@/features/catalog/components/nft-carousel'
import { relatedNftsQueryOptions } from '../api/nft-detail-queries'

type RelatedNftsProps = {
  nftId: string
}

export function RelatedNfts({ nftId }: RelatedNftsProps) {
  const { data, isError } = useQuery(relatedNftsQueryOptions(nftId))

  if (isError) {
    return null
  }

  return (
    <NftCarousel
      title="Mais desta coleção"
      titleId="related-title"
      pagesLabel="Páginas de NFTs relacionados"
      items={data?.items}
    />
  )
}
