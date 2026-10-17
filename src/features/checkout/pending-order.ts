const STORAGE_PREFIX = 'kurio:pending-order:'

export function readPendingOrderId(userId: string): string | null {
  try {
    return globalThis.localStorage?.getItem(`${STORAGE_PREFIX}${userId}`) ?? null
  } catch {
    return null
  }
}

export function savePendingOrderId(userId: string, orderId: string) {
  try {
    globalThis.localStorage?.setItem(`${STORAGE_PREFIX}${userId}`, orderId)
  } catch {
    return
  }
}

export function clearPendingOrderId(userId: string, orderId?: string) {
  try {
    const key = `${STORAGE_PREFIX}${userId}`
    if (orderId && globalThis.localStorage?.getItem(key) !== orderId) {
      return
    }
    globalThis.localStorage?.removeItem(key)
  } catch {
    return
  }
}
