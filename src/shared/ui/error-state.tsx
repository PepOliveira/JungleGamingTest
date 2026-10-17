import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/ui/button'

type ErrorStateProps = {
  title: string
  description: string
  onRetry?: () => void
  retrying?: boolean
}

export function ErrorState({ title, description, onRetry, retrying = false }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center"
    >
      <AlertTriangle className="size-8 text-primary" aria-hidden="true" />
      <h3 className="text-base font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button size="lg" onClick={onRetry} disabled={retrying}>
          {retrying ? 'Tentando novamente...' : 'Tentar novamente'}
        </Button>
      ) : null}
    </div>
  )
}
