type Listener = () => void

export type Announcement = {
  id: number
  message: string
  visible: boolean
  tone: 'info' | 'error'
}

type AnnounceOptions = {
  visible?: boolean
  tone?: Announcement['tone']
}

let current: Announcement = { id: 0, message: '', visible: false, tone: 'info' }
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

export function announce(
  message: string,
  { visible = false, tone = 'info' }: AnnounceOptions = {},
) {
  current = { id: current.id + 1, message, visible, tone }
  listeners.forEach((listener) => listener())
}
