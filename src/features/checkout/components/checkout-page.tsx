import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Cart } from '@/contracts/cart'
import { createOrderRequestSchema } from '@/contracts/order'
import { quoteSchema } from '@/contracts/quote'
import type { Quote } from '@/contracts/quote'
import type { User } from '@/contracts/auth'
import type { Wallet, WalletConnection, WalletProvider } from '@/contracts/wallet'
import { useCart } from '@/features/cart/use-cart'
import { useProfile } from '@/features/profile/use-profile'
import { useWallets } from '@/features/wallets/use-wallets'
import { toApiError } from '@/shared/api/api-error'
import { announce } from '@/shared/lib/announcer'
import { formatEth } from '@/shared/lib/eth'
import { UnavailableLink } from '@/shared/layout/unavailable-link'
import { Button } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/error-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { describeQuoteChange } from '../quote-diff'
import type { QuoteChange } from '../quote-diff'
import {
  useCheckoutQuote,
  useConnectWallet,
  useDisconnectWallet,
  useReplaceQuote,
  useSubmitOrder,
} from '../use-checkout'
import { CollectorFields } from './collector-fields'
import type { CollectorFormValues } from './collector-fields'
import { ConnectionPanel } from './connection-panel'
import { OrderSummary } from './order-summary'
import { ProviderOptions } from './provider-options'
import { WalletCards } from './wallet-cards'

const collectorSchema = z.object({
  fullName: createOrderRequestSchema.shape.collector.shape.fullName,
  email: createOrderRequestSchema.shape.collector.shape.email,
  note: z.string().trim().max(500, 'A observação deve ter até 500 caracteres'),
})

const DEFAULT_PROVIDER: WalletProvider = 'metamask'

const containerClass = 'mx-auto w-full max-w-[1248px] px-7 pb-48 lg:px-6 lg:pt-8 lg:pb-16'

function Header() {
  const router = useRouter()

  return (
    <>
      <div className="relative flex items-center justify-center pt-5 pb-5 lg:hidden">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="absolute left-0 flex size-10 items-center justify-center rounded-full bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          <span className="sr-only">Voltar</span>
        </button>
        <p aria-hidden="true" className="text-lg font-bold">
          Pagamento com carteira
        </p>
      </div>
      <nav aria-label="Você está em" className="mb-6 hidden text-xs font-bold lg:block">
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
          <li aria-hidden="true">/</li>
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>
      <h1 className="sr-only">Pagamento com carteira</h1>
    </>
  )
}

export function CheckoutPage() {
  const cart = useCart()
  const profile = useProfile()
  const wallets = useWallets()

  if (cart.isPending || profile.isPending || wallets.isPending) {
    return (
      <div className={containerClass}>
        <Header />
        <div aria-busy="true" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_405px]">
          <p role="status" className="sr-only">
            Carregando pagamento
          </p>
          <Skeleton className="h-96" />
          <Skeleton className="hidden h-96 lg:block" />
        </div>
      </div>
    )
  }

  const failed = cart.isError ? cart : profile.isError ? profile : wallets.isError ? wallets : null
  if (failed || !cart.data || !profile.data || !wallets.data) {
    const target = failed ?? cart
    return (
      <div className={containerClass}>
        <Header />
        <ErrorState
          title="Não foi possível carregar o pagamento"
          description={toApiError(target.error).message}
          onRetry={() => void target.refetch()}
          retrying={target.isFetching}
        />
      </div>
    )
  }

  if (cart.data.items.length === 0) {
    return (
      <div className={containerClass}>
        <Header />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-14 text-center">
          <h2 className="text-base font-bold">Seu carrinho está vazio</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Adicione NFTs ao carrinho para seguir para o pagamento.
          </p>
          <Button asChild size="lg" className="mt-2">
            <Link to="/">Explorar NFTs</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (wallets.data.items.length === 0) {
    return (
      <div className={containerClass}>
        <Header />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-14 text-center">
          <h2 className="text-base font-bold">Cadastre uma carteira para pagar</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            O pagamento usa uma das suas carteiras cadastradas.
          </p>
          <Button asChild size="lg" className="mt-2">
            <Link to="/perfil/carteiras">Cadastrar carteira</Link>
          </Button>
        </div>
      </div>
    )
  }

  return <CheckoutContent cart={cart.data} profile={profile.data} wallets={wallets.data.items} />
}

type CheckoutContentProps = {
  cart: Cart
  profile: User
  wallets: readonly Wallet[]
}

function CheckoutContent({ cart, profile, wallets }: CheckoutContentProps) {
  const navigate = useNavigate()
  const primary = wallets.find((candidate) => candidate.kind === 'primary') ?? wallets[0]

  const [walletId, setWalletId] = useState<string | null>(null)
  const [providerChoice, setProviderChoice] = useState<WalletProvider | null>(null)
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [quoteChange, setQuoteChange] = useState<QuoteChange | null>(null)

  const wallet = wallets.find((candidate) => candidate.id === walletId) ?? primary
  const provider = providerChoice ?? wallet?.provider ?? DEFAULT_PROVIDER

  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const quoteQuery = useCheckoutQuote(wallet?.network ?? null)
  const replaceQuote = useReplaceQuote()
  const submit = useSubmitOrder()
  const quote = quoteQuery.data
  const previousQuote = useRef<Quote | null>(null)

  useEffect(() => {
    const previous = previousQuote.current
    previousQuote.current = quote ?? null
    if (!previous || !quote || previous.id === quote.id || previous.network !== quote.network) {
      return
    }
    const change = describeQuoteChange(previous, quote)
    if (change.direction !== 'same') {
      setQuoteChange(change)
    }
  }, [quote])

  const form = useForm<CollectorFormValues>({
    resolver: zodResolver(collectorSchema),
    defaultValues: { fullName: profile.name, email: profile.email, note: '' },
  })

  const hasBlockingItems = cart.items.some((item) => item.quantity > item.available)
  const busy = submit.isPending

  function resetConnection() {
    if (connection) {
      disconnect.mutate(connection.id)
    }
    setConnection(null)
    setConnectError(null)
  }

  function selectWallet(nextId: string) {
    if (nextId === wallet?.id) return
    resetConnection()
    setWalletId(nextId)
    setProviderChoice(null)
    setQuoteChange(null)
  }

  function selectProvider(next: WalletProvider) {
    if (next === provider) return
    resetConnection()
    setProviderChoice(next)
  }

  function handleConnect() {
    if (!wallet) return
    setConnectError(null)
    connect.mutate(
      { walletId: wallet.id, provider },
      {
        onSuccess: (created) => {
          setConnection(created)
          announce('Carteira conectada')
        },
        onError: (error) => setConnectError(toApiError(error).message),
      },
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!wallet || !connection || !quote) {
      setSubmitError('Conecte sua carteira para confirmar a compra.')
      return
    }

    setSubmitError(null)
    try {
      const order = await submit.mutateAsync({
        quote,
        walletId: wallet.id,
        connectionId: connection.id,
        fullName: values.fullName,
        email: values.email,
        note: values.note,
      })
      await navigate({ to: '/pedido/$orderId', params: { orderId: order.id } })
    } catch (error) {
      const apiError = toApiError(error)

      if (apiError.code === 'quote_outdated') {
        const next = quoteSchema.safeParse(apiError.details.quote)
        if (next.success) {
          const unchanged = describeQuoteChange(quote, next.data).direction === 'same'
          replaceQuote(next.data)
          announce(
            unchanged
              ? 'A cotação expirou e foi renovada. Confirme novamente.'
              : 'Os valores do pedido mudaram. Revise e confirme novamente.',
            { visible: true, tone: 'error' },
          )
          return
        }
      }

      if (apiError.code === 'availability_conflict') {
        setSubmitError(
          'Alguns itens não estão mais disponíveis na quantidade escolhida. Revise o carrinho.',
        )
        return
      }

      setSubmitError(apiError.fieldErrors.connectionId?.[0] ?? apiError.message)
    }
  })

  const confirmLabel = busy
    ? 'Confirmando compra...'
    : quoteChange
      ? 'Confirmar com os novos valores'
      : 'Confirmar compra'

  const canConfirm =
    Boolean(connection && quote) && !busy && !quoteQuery.isFetching && !hasBlockingItems

  return (
    <div className={containerClass}>
      <Header />
      <form
        id="checkout-form"
        noValidate
        onSubmit={onSubmit}
        className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_405px] lg:items-start lg:gap-8"
      >
        <div className="max-lg:contents lg:flex lg:flex-col lg:gap-10">
          <div className="max-lg:order-3">
            <CollectorFields
              register={form.register}
              errors={form.formState.errors}
              profile={profile}
              wallet={wallet}
            />
          </div>

          <section aria-labelledby="wallets-title" className="flex flex-col gap-4 max-lg:order-1">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="wallets-title" className="text-base font-bold">
                {connection ? 'Carteira conectada' : 'Carteira para receber os NFTs'}
              </h2>
              {connection ? (
                <button
                  type="button"
                  onClick={resetConnection}
                  className="rounded-sm text-sm font-bold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Trocar carteira
                </button>
              ) : null}
            </div>
            <WalletCards
              wallets={wallets}
              selectedId={wallet?.id ?? null}
              disabled={busy || connect.isPending}
              onSelect={selectWallet}
            />
          </section>
        </div>

        <div className="max-lg:contents lg:flex lg:flex-col lg:gap-8">
          <div className="max-lg:order-4">
            <OrderSummary cart={cart} quote={quote} loading={quoteQuery.isPending} />
            {quoteQuery.isError ? (
              <div className="mt-4">
                <ErrorState
                  title="Não foi possível calcular o total"
                  description={toApiError(quoteQuery.error).message}
                  onRetry={() => void quoteQuery.refetch()}
                  retrying={quoteQuery.isFetching}
                />
              </div>
            ) : null}
          </div>

          <section aria-labelledby="provider-title" className="flex flex-col gap-4 max-lg:order-2">
            <h2 id="provider-title" className="text-base font-bold lg:text-center">
              Carteira e rede
            </h2>
            <ProviderOptions
              value={provider}
              disabled={busy || connect.isPending}
              onChange={selectProvider}
            />
            <ConnectionPanel
              connection={connection}
              connecting={connect.isPending}
              error={connectError}
              disconnecting={disconnect.isPending}
              disabled={busy || !wallet}
              onConnect={handleConnect}
              onDisconnect={resetConnection}
            />
          </section>

          <div className="flex flex-col gap-3 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:order-5 max-lg:border-t max-lg:border-border max-lg:bg-background max-lg:px-5 max-lg:pt-4 max-lg:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {quote ? (
              <p className="flex items-baseline justify-end gap-4 text-sm lg:hidden">
                <span className="font-bold">Total:</span>
                <span className="text-lg font-bold text-primary-bright">
                  {formatEth(quote.total)} ETH
                </span>
              </p>
            ) : null}

            {quoteChange ? (
              <p
                role="alert"
                className="rounded-md border border-primary bg-primary/10 px-3 py-2 text-xs text-warm"
              >
                Os valores do pedido mudaram: o total{' '}
                {quoteChange.direction === 'up'
                  ? 'subiu'
                  : quoteChange.direction === 'down'
                    ? 'caiu'
                    : 'foi recalculado'}{' '}
                de {formatEth(quoteChange.previousTotal)} para {formatEth(quoteChange.nextTotal)}{' '}
                ETH. Revise e confirme novamente.
              </p>
            ) : null}

            {submitError ? (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {submitError}{' '}
                {submitError.includes('carrinho') ? (
                  <Link to="/carrinho" className="underline">
                    Voltar ao carrinho
                  </Link>
                ) : null}
              </p>
            ) : null}

            {!connection && !busy ? (
              <p className="text-xs text-muted-foreground" role="status">
                Conecte sua carteira para confirmar a compra.
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={!canConfirm}
              className="h-12 w-full rounded-full bg-gradient-to-b from-[#d28a4c] to-[#a8693a] text-base font-bold lg:h-11 lg:rounded-sm lg:bg-primary lg:bg-none lg:text-sm"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
