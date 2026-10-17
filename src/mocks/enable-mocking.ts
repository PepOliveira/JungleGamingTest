import { env } from '@/shared/config/env'
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

  window.__KURIO_MOCKS__ = createMockControls()
}
