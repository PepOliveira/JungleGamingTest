import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import type { Order } from '@/contracts/order'
import { networkLabels } from '@/features/catalog/labels'
import { providerLabels } from '@/features/wallets/labels'
import { formatEth, formatEthWithSymbol } from '@/shared/lib/eth'
import { formatReceiptDate, shortenMiddle } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { ResponsiveImage } from '@/shared/ui/responsive-image'
import { ThankYouIcon } from './thank-you-icon'

const explorerNames = {
  ethereum: 'Etherscan',
  polygon: 'Polygonscan',
  solana: 'Solscan',
} as const

type OrderReceiptProps = {
  order: Order
}

function Fact({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 px-4 first:pl-0 last:pr-0 max-sm:px-0">
      <dt className={strong ? 'font-bold text-warm' : 'text-warm'}>{label}</dt>
      <dd className="text-warm">{value}</dd>
    </div>
  )
}

export function OrderReceipt({ order }: OrderReceiptProps) {
  const explorer = explorerNames[order.network]

  return (
    <article
      aria-labelledby="receipt-title"
      className="relative mx-auto w-full max-w-[580px] border-b-[10px] border-primary bg-card"
    >
      <Link
        to="/"
        aria-label="Fechar recibo e voltar ao início"
        className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-sm text-primary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-5" aria-hidden="true" />
      </Link>

      <header className="flex flex-col items-center gap-3 px-6 pt-6 pb-5">
        <ThankYouIcon className="h-20 text-primary" />
        <h1 id="receipt-title" className="text-center text-sm font-bold text-warm">
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>

      <dl className="grid grid-cols-2 gap-4 border-y border-primary px-6 py-4 text-xs sm:flex sm:justify-between sm:divide-x sm:divide-primary sm:gap-0">
        <Fact
          label="ID da transação"
          value={shortenMiddle(order.transactionHash ?? order.id)}
          strong
        />
        <Fact label="Data" value={formatReceiptDate(order.updatedAt)} />
        <Fact label="Total" value={formatEthWithSymbol(order.total)} />
        <Fact label="Carteira" value={providerLabels[order.walletProvider]} strong />
      </dl>

      <div className="flex flex-col gap-4 px-6 pt-6 pb-8 sm:px-11">
        <h2 className="text-sm font-bold">Detalhes da transação</h2>

        <div>
          <div
            aria-hidden="true"
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[minmax(0,1fr)_72px_96px] items-center gap-2 border-b border-border pb-2 text-sm font-bold"
          >
            <span>NFTs</span>
            <span className="text-center">Edições</span>
            <span className="text-right">Subtotal</span>
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {order.items.map((item) => (
              <li
                key={`${item.nftId}-${item.editionId}`}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[minmax(0,1fr)_72px_96px] items-center gap-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-md bg-canvas sm:size-[65px]">
                    <ResponsiveImage image={{ url: item.imageUrl, alt: item.name }} sizes="65px" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold break-words sm:truncate">{item.name}</p>
                    <p className="text-xs text-warm">ID do token: {item.tokenId}</p>
                  </div>
                </div>
                <p className="text-center text-xs text-warm">
                  <span className="sr-only">Quantidade </span>(x {item.quantity})
                </p>
                <p className="text-right text-sm font-bold text-primary-bright">
                  <span className="sr-only">Subtotal </span>
                  {formatEthWithSymbol(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <dl className="flex flex-col gap-1 border-b border-primary/60 pb-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="font-bold">Taxa de rede</dt>
            <dd>{formatEth(order.networkFee)} ETH</dd>
          </div>
          {order.discount !== '0' ? (
            <div className="flex justify-between gap-4">
              <dt className="font-bold">Desconto</dt>
              <dd>(-) {formatEth(order.discount)} ETH</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="font-bold">Total</dt>
            <dd className="font-bold text-primary-bright">{formatEth(order.total)} ETH</dd>
          </div>
        </dl>

        <p className="text-center text-xs leading-relaxed text-warm">
          Transação confirmada na {networkLabels[order.network]}. A propriedade foi transferida para
          sua carteira conectada e registrada na rede.
        </p>

        {order.explorerUrl ? (
          <Button asChild size="lg" className="mx-auto h-11 px-6 font-bold">
            <a href={order.explorerUrl} target="_blank" rel="noopener noreferrer">
              Ver no {explorer}
              <span className="sr-only"> (abre em nova aba; link simulado)</span>
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  )
}
