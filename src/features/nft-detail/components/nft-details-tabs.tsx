import type { NftDetail } from '@/contracts/nft'
import { networkLabels } from '@/features/catalog/labels'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

type NftDetailsTabsProps = {
  nft: NftDetail
}

function shortenAddress(address: string) {
  return address.length > 14 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address
}

export function NftDetailsTabs({ nft }: NftDetailsTabsProps) {
  const network = networkLabels[nft.network]
  const contractKind =
    nft.network === 'solana'
      ? 'Programa verificado na Solana.'
      : 'Contrato inteligente ERC-721 verificado.'

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Detalhes do NFT</TabsTrigger>
        <TabsTrigger value="reviews">Avaliações de colecionadores ({nft.rating.count})</TabsTrigger>
      </TabsList>
      <TabsContent
        value="details"
        className="flex flex-col gap-6 text-sm leading-relaxed text-warm"
      >
        <div className="flex flex-col gap-4">
          {nft.description.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <dl className="flex flex-col gap-4">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>Cunhado na {network} com procedência imutável e metadados armazenados no IPFS.</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>
              Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos
              automaticamente pelos mercados compatíveis.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>
              {shortenAddress(nft.contractAddress)} <span aria-hidden="true">•</span> {contractKind}
            </dd>
          </div>
        </dl>
      </TabsContent>
      <TabsContent value="reviews" className="text-sm text-muted-foreground">
        <p role="status">
          As avaliações detalhadas dos colecionadores não estão disponíveis nesta versão.
        </p>
      </TabsContent>
    </Tabs>
  )
}
