import { CheckCircle2, Loader2 } from 'lucide-react'
import type { WalletConnection } from '@/contracts/wallet'
import { providerLabels } from '@/features/wallets/labels'
import { shortenMiddle } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'

type ConnectionPanelProps = {
  connection: WalletConnection | null
  connecting: boolean
  error: string | null
  disconnecting: boolean
  disabled: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export function ConnectionPanel({
  connection,
  connecting,
  error,
  disconnecting,
  disabled,
  onConnect,
  onDisconnect,
}: ConnectionPanelProps) {
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {connection ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary px-4 py-3 text-sm">
          <p className="flex items-center gap-2" role="status">
            <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Carteira conectada: {providerLabels[connection.provider]} ·{' '}
              {shortenMiddle(connection.address)}
            </span>
          </p>
          <button
            type="button"
            disabled={disconnecting}
            onClick={onDisconnect}
            className="rounded-sm text-xs text-primary underline outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            Desconectar
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={disabled || connecting}
          onClick={onConnect}
          className="h-10 w-full gap-2 border-primary text-primary"
        >
          {connecting ? (
            <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : null}
          {connecting ? 'Conectando carteira...' : 'Conectar carteira'}
        </Button>
      )}
      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
