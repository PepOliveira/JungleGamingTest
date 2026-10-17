import { createFileRoute } from '@tanstack/react-router'
import { nftDetailQueryOptions } from '@/features/nft-detail/api/nft-detail-queries'
import { NftDetailPage } from '@/features/nft-detail/components/nft-detail-page'

type NftDetailSearch = {
  edicao?: string
}

export const Route = createFileRoute('/nfts/$nftId')({
  validateSearch: (search: Record<string, unknown>): NftDetailSearch => ({
    edicao: typeof search.edicao === 'string' ? search.edicao : undefined,
  }),
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftDetailQueryOptions(params.nftId))
  },
  component: NftDetailPage,
})
