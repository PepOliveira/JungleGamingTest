let ready: Promise<void> = Promise.resolve()

export function setRuntimeReady(promise: Promise<void>) {
  ready = promise.catch(() => undefined)
}

export function whenRuntimeReady() {
  return ready
}
