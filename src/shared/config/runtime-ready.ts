let ready: Promise<void> = Promise.resolve()
let preflight: (() => Promise<void>) | null = null

export function setRuntimeReady(promise: Promise<void>) {
  ready = promise.catch(() => undefined)
}

export function setRequestPreflight(callback: (() => Promise<void>) | null) {
  preflight = callback
}

export async function whenRuntimeReady() {
  await ready
  if (preflight) {
    try {
      await preflight()
    } catch {
      return
    }
  }
}
