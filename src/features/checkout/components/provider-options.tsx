import { Wallet as WalletIcon } from 'lucide-react'
import { walletProviderSchema } from '@/contracts/wallet'
import type { WalletProvider } from '@/contracts/wallet'
import { providerLabels } from '@/features/wallets/labels'
import { cn } from '@/shared/lib/utils'

type ProviderOptionsProps = {
  value: WalletProvider
  disabled?: boolean
  onChange: (provider: WalletProvider) => void
}

const initials: Record<WalletProvider, string> = {
  walletconnect: 'W',
  metamask: 'M',
  coinbase: '',
}

export function ProviderOptions({ value, disabled = false, onChange }: ProviderOptionsProps) {
  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="sr-only">Tipo de carteira</legend>
      {walletProviderSchema.options.map((provider) => {
        const inputId = `provider-${provider}`
        return (
          <div key={provider} className="relative">
            <input
              id={inputId}
              type="radio"
              name="checkout-provider"
              value={provider}
              checked={provider === value}
              onChange={() => onChange(provider)}
              className="peer sr-only"
            />
            <label
              htmlFor={inputId}
              className="flex cursor-pointer items-center gap-4 rounded-xl bg-card p-3 pr-4 ring-1 ring-transparent transition peer-checked:ring-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
            >
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary"
              >
                {initials[provider] || <WalletIcon className="size-5" />}
              </span>
              <span className="flex-1 text-sm">{providerLabels[provider]}</span>
              <span
                aria-hidden="true"
                className={cn(
                  'relative size-5 shrink-0 rounded-full border-2',
                  provider === value
                    ? 'border-primary after:absolute after:inset-1 after:rounded-full after:bg-primary'
                    : 'border-primary/50',
                )}
              />
            </label>
          </div>
        )
      })}
    </fieldset>
  )
}
