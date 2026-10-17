const ACTIVATE_MESSAGE = 'MOCK_ACTIVATE'
const ENABLED_EVENT = 'MOCKING_ENABLED'
const HEARTBEAT_MS = 10_000
const ACK_TIMEOUT_MS = 400

let inflight: Promise<void> | null = null

function activate(): Promise<void> {
  const container = navigator.serviceWorker
  const controller = container?.controller
  if (!controller) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const finish = () => {
      container.removeEventListener('message', onMessage)
      clearTimeout(timer)
      inflight = null
      resolve()
    }
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === ENABLED_EVENT) finish()
    }
    const timer = setTimeout(finish, ACK_TIMEOUT_MS)
    container.addEventListener('message', onMessage)
    controller.postMessage(ACTIVATE_MESSAGE)
  })
}

export function ensureWorkerActive(): Promise<void> {
  inflight ??= activate()
  return inflight
}

export function startWorkerHeartbeat() {
  setInterval(() => {
    void ensureWorkerActive()
  }, HEARTBEAT_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void ensureWorkerActive()
  })
}
