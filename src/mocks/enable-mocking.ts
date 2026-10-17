import { env } from '@/shared/config/env'
import { setRequestPreflight } from '@/shared/config/runtime-ready'
import { ensureWorkerActive, startWorkerHeartbeat } from './worker-keepalive'
import type { MockControls } from './controls'

declare global {
  interface Window {
    __KURIO_MOCKS__?: MockControls
  }
}

export async function enableMocking() {
  if (!env.VITE_ENABLE_MOCKS) {
    return
  }

  const [{ worker }, { createMockControls }] = await Promise.all([
    import('./browser'),
    import('./controls'),
  ])
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true })

  setRequestPreflight(ensureWorkerActive)
  startWorkerHeartbeat()

  window.__KURIO_MOCKS__ = createMockControls()
}
