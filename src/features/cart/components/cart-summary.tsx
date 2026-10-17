import { Link, useNavigate } from '@tanstack/react-router'
import type { Cart } from '@/contracts/cart'
import { useSession } from '@/features/auth/use-session'
import { stripAuthParams } from '@/features/auth/search'
import { formatEth } from '@/shared/lib/eth'
import { UnavailableLink } from '@/shared/layout/unavailable-link'
import { Button } from '@/shared/ui/button'
import { PromoCodeForm } from './promo-code-form'

type CartSummaryProps = {
  cart: Cart
  hasBlockingItems: boolean
}

function SummaryLine({ label, value, note }: { label: string; value: string; note?: string }) {
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

export function CartSummary({ cart, hasBlockingItems }: CartSummaryProps) {
  const session = useSession()
  const navigate = useNavigate()
  const { summary } = cart
  const empty = cart.items.length === 0

  function handleCheckout() {
    if (session.status !== 'authenticated') {
      const returnTo = stripAuthParams(window.location.href, window.location.origin)
      void navigate({
        to: '.',
        search: (previous) => ({ ...previous, auth: 'entrar' as const, retorno: returnTo }),
        resetScroll: false,
      })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PromoCodeForm couponCode={cart.couponCode} disabled={empty} />

      <dl className="flex flex-col gap-3">
        <SummaryLine label="Subtotal" value={`${formatEth(summary.subtotal)} ETH`} />
        <SummaryLine label="Desconto do lançamento" value={`(-) ${formatEth(summary.discount)}`} />
        <SummaryLine
          label="Taxa de rede"
          value={`${formatEth(summary.networkFee)} ETH`}
          note="Taxa estimada"
        />
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <dt className="text-sm font-bold">Total</dt>
          <dd className="text-xl font-bold text-primary-bright">
            <span className="sr-only">Total </span>
            {formatEth(summary.total)} ETH
          </dd>
        </div>
      </dl>

      {hasBlockingItems ? (
        <p role="status" className="text-xs text-destructive">
          Resolva os itens indisponíveis para continuar.
        </p>
      ) : null}

      {session.status === 'authenticated' ? (
        <Button
          asChild
          size="lg"
          className="h-12 w-full rounded-full bg-gradient-to-b from-[#d28a4c] to-[#a8693a] text-base font-bold aria-disabled:pointer-events-none aria-disabled:opacity-50 lg:h-10 lg:rounded-sm lg:bg-primary lg:bg-none lg:text-sm"
        >
          <UnavailableLink
            secao="pagamento"
            aria-disabled={empty || hasBlockingItems}
            tabIndex={empty || hasBlockingItems ? -1 : undefined}
          >
            Conectar e finalizar
          </UnavailableLink>
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          disabled={empty || hasBlockingItems}
          onClick={handleCheckout}
          className="h-12 w-full rounded-full bg-gradient-to-b from-[#d28a4c] to-[#a8693a] text-base font-bold lg:h-10 lg:rounded-sm lg:bg-primary lg:bg-none lg:text-sm"
        >
          Conectar e finalizar
        </Button>
      )}

      <Link
        to="/"
        className="hidden self-center rounded-sm text-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring lg:block"
      >
        Continuar explorando
      </Link>
    </div>
  )
}
