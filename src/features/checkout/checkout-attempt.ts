const STORAGE_KEY = 'kurio:checkout-attempt'

type Attempt = {
  fingerprint: string
  key: string
}

function generateKey() {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return `idem_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

function isAttempt(value: unknown): value is Attempt {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.fingerprint === 'string' && typeof candidate.key === 'string'
}

function read(): Attempt | null {
  try {
    const raw = globalThis.sessionStorage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isAttempt(parsed) ? parsed : null
  } catch {
    return null
  }
}

function write(attempt: Attempt | null) {
  try {
    if (attempt) {
      globalThis.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(attempt))
    } else {
      globalThis.sessionStorage?.removeItem(STORAGE_KEY)
    }
  } catch {
    return
  }
}

let memory: Attempt | null = null

export function getAttemptKey(fingerprint: string) {
  const current = memory ?? read()
  if (current && current.fingerprint === fingerprint) {
    memory = current
    return current.key
  }

  const next = { fingerprint, key: generateKey() }
  memory = next
  write(next)
  return next.key
}

export function clearAttempt() {
  memory = null
  write(null)
}

export function checkoutFingerprint(parts: {
  quoteId: string
  walletId: string
  connectionId: string
  fullName: string
  email: string
  note: string
}) {
  return JSON.stringify([
    parts.quoteId,
    parts.walletId,
    parts.connectionId,
    parts.fullName,
    parts.email.toLowerCase(),
    parts.note,
  ])
}
