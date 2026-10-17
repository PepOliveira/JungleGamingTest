type Listener = () => void

let current = { id: 0, message: '' }
const listeners = new Set<Listener>()

export const announcer = {
  getSnapshot: () => current,
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function announce(message: string) {
  current = { id: current.id + 1, message }
  listeners.forEach((listener) => listener())
}
