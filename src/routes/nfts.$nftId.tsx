import { createFileRoute } from '@tanstack/react-router'
import { StatusPage } from '@/shared/layout/status-page'

export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetailPlaceholder,
})

function NftDetailPlaceholder() {
  return (
    <StatusPage
      title="Detalhes do NFT"
      description="Esta tela será entregue na próxima etapa do projeto."
    />
  )
}
