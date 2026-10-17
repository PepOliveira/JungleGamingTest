import { useSyncExternalStore } from 'react'
import { announcer } from '@/shared/lib/announcer'
import { cn } from '@/shared/lib/utils'

export function LiveRegion() {
  const { id, message, visible, tone } = useSyncExternalStore(
    announcer.subscribe,
    announcer.getSnapshot,
    announcer.getSnapshot,
  )

  return (
    <>
      <p
        key={`status-${id}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </p>
      {visible && message ? (
        <div
          key={`toast-${id}`}
          aria-hidden="true"
          className={cn(
            'toast pointer-events-none fixed top-4 left-1/2 lg:top-20 z-[60] max-w-[90vw] -translate-x-1/2 rounded-md border bg-card px-4 py-3 text-sm  shadow-lg',
            tone === 'error' ? 'border-destructive/70' : 'border-border',
          )}
        >
          {message}
        </div>
      ) : null}
    </>
  )
}
