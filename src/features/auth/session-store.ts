const STORAGE_KEY = 'kurio:session'

export type StoredSession = {
  accessToken: string
  expiresAt: string
}

type Listener = () => void

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.accessToken === 'string' && typeof candidate.expiresAt === 'string'
}

function readStored(): StoredSession | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isStoredSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeStored(session: StoredSession | null) {
  try {
    if (session) {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      globalThis.localStorage?.removeItem(STORAGE_KEY)
    }
  } catch {
    return
  }
}

let current: StoredSession | null = readStored()
const listeners = new Set<Listener>()
const endListeners = new Set<Listener>()
const startListeners = new Set<Listener>()

function emit() {
  listeners.forEach((listener) => listener())
}

export const SESSION_STORAGE_KEY = STORAGE_KEY

export const sessionStore = {
  getSnapshot: () => current,
  getAccessToken: () => current?.accessToken ?? null,
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  set(session: StoredSession) {
    const changed = current?.accessToken !== session.accessToken
    current = session
    writeStored(session)
    emit()
    if (changed) {
      startListeners.forEach((listener) => listener())
    }
  },
  clear() {
    const hadSession = current !== null
    current = null
    writeStored(null)
    emit()
    if (hadSession) {
      endListeners.forEach((listener) => listener())
    }
  },
  syncFromStorage() {
    const previous = current
    current = readStored()
    emit()
    if (previous && !current) {
      endListeners.forEach((listener) => listener())
    }
  },
  onStart(listener: Listener) {
    startListeners.add(listener)
    return () => {
      startListeners.delete(listener)
    }
  },
  onEnd(listener: Listener) {
    endListeners.add(listener)
    return () => {
      endListeners.delete(listener)
    }
  },
}
