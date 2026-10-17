import { env } from '@/shared/config/env'
import { resetDb } from './db/store'
import { getScenario, setScenario } from './scenarios'
import type { ScenarioName } from './scenarios'

export type MockControls = {
  reset: () => void
  getScenario: () => ScenarioName
  setScenario: (name: ScenarioName) => void
}

declare global {
  interface Window {
    __KURIO_MOCKS__?: MockControls
  }
}

export async function enableMocking() {
  if (!env.VITE_ENABLE_MOCKS) {
    return
  }

  const { worker } = await import('./browser')
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true })

  window.__KURIO_MOCKS__ = {
    reset: resetDb,
    getScenario: () => getScenario().name,
    setScenario,
  }
}
