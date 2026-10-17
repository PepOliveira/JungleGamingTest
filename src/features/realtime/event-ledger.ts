const DEFAULT_CAPACITY = 200

export type EventLedger = {
  seen: (eventId: string) => boolean
  clear: () => void
}

export function createEventLedger(capacity = DEFAULT_CAPACITY): EventLedger {
  const ids = new Set<string>()

  return {
    seen(eventId) {
      if (ids.has(eventId)) {
        return true
      }
      ids.add(eventId)
      if (ids.size > capacity) {
        const oldest = ids.values().next().value
        if (oldest !== undefined) ids.delete(oldest)
      }
      return false
    },
    clear() {
      ids.clear()
    },
  }
}
