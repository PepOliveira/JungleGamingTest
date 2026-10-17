import { Link } from '@tanstack/react-router'
import { MoreVertical } from 'lucide-react'
import type { Wallet } from '@/contracts/wallet'
import { networkLabels } from '@/features/catalog/labels'
import { shortenMiddle } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

type WalletCardsProps = {
  wallets: readonly Wallet[]
  selectedId: string | null
  disabled?: boolean
  onSelect: (walletId: string) => void
}

export function WalletCards({ wallets, selectedId, disabled = false, onSelect }: WalletCardsProps) {
  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="sr-only">Carteira para receber os NFTs</legend>
      {wallets.map((wallet) => {
        const inputId = `wallet-${wallet.id}`
        const identity = wallet.ensName.name
          ? `${wallet.ensName.name}${wallet.ensName.suffix}`
          : shortenMiddle(wallet.address)

        return (
          <div key={wallet.id} className="relative">
            <input
              id={inputId}
              type="radio"
              name="checkout-wallet"
              value={wallet.id}
              checked={wallet.id === selectedId}
              onChange={() => onSelect(wallet.id)}
              className="peer sr-only"
            />
            <label
              htmlFor={inputId}
              className={cn(
                'flex cursor-pointer items-center gap-4 rounded-xl bg-card p-4 pr-12 ring-1 ring-transparent transition peer-checked:ring-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'relative size-5 shrink-0 rounded-full border-2',
                  wallet.id === selectedId
                    ? 'border-primary after:absolute after:inset-1 after:rounded-full after:bg-primary'
                    : 'border-primary/50',
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-bold">{wallet.label}</span>
                <span className="mt-1 block truncate text-sm text-warm">{identity}</span>
                <span className="block text-sm text-warm">
                  Rede {wallet.kind === 'primary' ? 'principal ' : ''}
                  {networkLabels[wallet.network]}
                </span>
              </span>
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="absolute top-4 right-3 flex size-8 items-center justify-center rounded-md text-warm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreVertical className="size-5" aria-hidden="true" />
                  <span className="sr-only">Opções da carteira {wallet.label}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/perfil/carteiras">Editar carteira</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}
    </fieldset>
  )
}
