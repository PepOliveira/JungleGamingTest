const STORAGE_KEY = 'kurio:guest-cart'
const TOKEN_BYTES = 16

let memoryToken: string | null = null

function generateToken() {
  const bytes = new Uint8Array(TOKEN_BYTES)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function readStored() {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

function writeStored(token: string) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, token)
  } catch {
    return
  }
}

export function getGuestCartToken() {
  const stored = memoryToken ?? readStored()
  if (stored) {
    memoryToken = stored
    return stored
  }
  const token = generateToken()
  memoryToken = token
  writeStored(token)
  return token
}
