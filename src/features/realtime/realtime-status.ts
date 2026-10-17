export type RealtimeStatus = 'idle' | 'connecting' | 'online' | 'offline'

type Listener = () => void

let current: RealtimeStatus = 'idle'
const listeners = new Set<Listener>()

function reflectOnDocument(status: RealtimeStatus) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.realtime = status
  }
}

export const realtimeStatus = {
  getSnapshot: () => current,
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  set(next: RealtimeStatus) {
    if (next === current) return
    current = next
    reflectOnDocument(next)
    listeners.forEach((listener) => listener())
  },
}
