import { useSyncExternalStore } from 'react'
import { announcer } from '@/shared/lib/announcer'

export function LiveRegion() {
  const { id, message } = useSyncExternalStore(
    announcer.subscribe,
    announcer.getSnapshot,
    announcer.getSnapshot,
  )

  return (
    <p key={id} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </p>
  )
}
