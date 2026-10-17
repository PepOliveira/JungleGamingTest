export function readStoredJson(key: string): unknown {
  try {
    const raw = globalThis.localStorage?.getItem(key)
    return raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    return null
  }
}

export function writeStoredJson(key: string, value: unknown) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export function removeStoredValue(key: string) {
  try {
    globalThis.localStorage?.removeItem(key)
  } catch {
    return
  }
}
