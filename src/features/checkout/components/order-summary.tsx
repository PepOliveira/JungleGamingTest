import { Link } from '@tanstack/react-router'
import type { Cart } from '@/contracts/cart'
import type { Quote } from '@/contracts/quote'
import { formatEth, formatEthWithSymbol } from '@/shared/lib/eth'
import { ResponsiveImage } from '@/shared/ui/responsive-image'
import { Skeleton } from '@/shared/ui/skeleton'

type OrderSummaryProps = {
  cart: Cart
  quote: Quote | undefined
  loading: boolean
}

function Line({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt>{label}</dt>
      <dd className="text-right">
        {value}
        {note ? <span className="block text-[11px] text-primary">{note}</span> : null}
      </dd>
    </div>
  )
}

export function OrderSummary({ cart, quote, loading }: OrderSummaryProps) {
  return (
    <section aria-labelledby="order-summary-title" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <h2 id="order-summary-title" className="text-base font-bold">
          Seus NFTs
        </h2>
        <span aria-hidden="true" className="text-sm">
          Subtotal
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {cart.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 rounded-lg bg-card p-2">
            <div className="size-[60px] shrink-0 overflow-hidden rounded-md bg-canvas">
              <ResponsiveImage image={item.image} sizes="60px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                ID do token: {item.tokenId} · {item.editionLabel}
              </p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              <span className="sr-only">Quantidade </span>(x {item.quantity})
            </p>
            <p className="shrink-0 text-sm font-bold text-primary-bright">
              <span className="sr-only">Subtotal </span>
              {formatEthWithSymbol(item.lineTotal)}
            </p>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs">
        Tem um código promocional?{' '}
        <Link to="/carrinho" className="text-primary underline">
          Aplique aqui
        </Link>
      </p>

      {loading || !quote ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-6 w-2/3 self-end" />
        </div>
      ) : (
        <dl className="flex flex-col gap-3">
          <Line label="Subtotal" value={`${formatEth(quote.subtotal)} ETH`} />
          <Line label="Desconto do lançamento" value={`(-) ${formatEth(quote.discount)}`} />
          <Line label="Taxa de rede" value={`${formatEth(quote.networkFee)} ETH`} />
          <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-4">
            <dt className="text-sm font-bold">Total</dt>
            <dd className="text-xl font-bold text-primary-bright">
              <span className="sr-only">Total </span>
              {formatEth(quote.total)} ETH
            </dd>
          </div>
        </dl>
      )}
    </section>
  )
}
