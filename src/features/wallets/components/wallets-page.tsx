import { useId, useState } from 'react'
import type { Wallet, WalletKind } from '@/contracts/wallet'
import type { User } from '@/contracts/auth'
import { useProfile } from '@/features/profile/use-profile'
import { toApiError } from '@/shared/api/api-error'
import { ErrorState } from '@/shared/ui/error-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { useWallets } from '../use-wallets'
import { WalletForm } from './wallet-form'

type WalletSectionProps = {
  kind: WalletKind
  wallet: Wallet | undefined
  primary: Wallet | undefined
  user: User | undefined
}

const addButtonClass =
  'rounded-sm text-base font-bold text-primary-bright outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:no-underline'

function WalletSection({ kind, wallet, primary, user }: WalletSectionProps) {
  const titleId = useId()
  const mirrorId = useId()
  const [adding, setAdding] = useState(false)
  const [mirror, setMirror] = useState(false)

  const isPrimary = kind === 'primary'
  const blockedByPrimary = !isPrimary && !primary
  const showForm = Boolean(wallet) || adding || mirror

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="text-base font-bold">
            {isPrimary ? 'Carteira principal' : 'Carteira secundária'}
          </h2>
          {isPrimary ? (
            <p className="text-xs text-warm">
              Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
            </p>
          ) : !wallet && !showForm ? (
            <p className="text-xs text-warm">
              {blockedByPrimary
                ? 'Cadastre a carteira principal para adicionar uma secundária.'
                : 'Você ainda não adicionou uma carteira secundária.'}
            </p>
          ) : null}
        </div>

        {!wallet ? (
          <div className="flex items-center gap-4">
            {!isPrimary ? (
              <label
                htmlFor={mirrorId}
                className="flex cursor-pointer items-center gap-2 text-xs has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
              >
                <input
                  id={mirrorId}
                  type="checkbox"
                  checked={mirror}
                  disabled={blockedByPrimary}
                  onChange={(event) => setMirror(event.target.checked)}
                  className="size-4 accent-[#d28a4c]"
                />
                Igual à carteira principal
              </label>
            ) : null}
            {!showForm || (!isPrimary && !mirror && !adding) ? (
              <button
                type="button"
                disabled={blockedByPrimary}
                onClick={() => setAdding(true)}
                className={addButtonClass}
              >
                Adicionar
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {showForm ? (
        <WalletForm
          key={`${wallet?.id ?? 'new'}-${mirror ? 'mirror' : 'free'}`}
          kind={kind}
          wallet={wallet}
          mirrorOf={mirror && !wallet ? primary : undefined}
          user={user}
          onSaved={() => {
            setAdding(false)
            setMirror(false)
          }}
        />
      ) : null}
    </section>
  )
}

export function WalletsPage() {
  const wallets = useWallets()
  const profile = useProfile()

  if (wallets.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-6">
        <p role="status" className="sr-only">
          Carregando carteiras
        </p>
        <h1 className="sr-only">Carteiras</h1>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-16" />
        ))}
      </div>
    )
  }

  if (wallets.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar as carteiras"
        description={toApiError(wallets.error).message}
        onRetry={() => void wallets.refetch()}
        retrying={wallets.isFetching}
      />
    )
  }

  const primary = wallets.data.items.find((wallet) => wallet.kind === 'primary')
  const secondary = wallets.data.items.find((wallet) => wallet.kind === 'secondary')

  return (
    <div className="flex flex-col gap-12">
      <h1 className="sr-only">Carteiras</h1>
      <WalletSection kind="primary" wallet={primary} primary={primary} user={profile.data} />
      <WalletSection kind="secondary" wallet={secondary} primary={primary} user={profile.data} />
    </div>
  )
}
