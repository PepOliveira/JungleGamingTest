import { env } from '@/shared/config/env'
import { resetDb } from './db/store'
import { addFault, clearFaults, listFaults, loseNextOrderResponses } from './faults'
import type { Fault } from './faults'
import { realtimeControls } from './realtime/controls'
import type { RealtimeControls } from './realtime/controls'
import { updateDb } from './db/store'
import { getScenario, setScenario } from './scenarios'
import type { ScenarioName } from './scenarios'

export type MockControls = {
  reset: () => void
  getScenario: () => ScenarioName
  setScenario: (name: ScenarioName) => void
  realtime: RealtimeControls
  faults: {
    add: (fault: Fault) => void
    clear: () => void
    list: () => ReturnType<typeof listFaults>
    loseOrderResponses: (times: number) => void
  }
  expireSessions: () => void
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
    reset: () => {
      resetDb()
      clearFaults()
    },
    getScenario: () => getScenario().name,
    setScenario,
    realtime: realtimeControls,
    faults: {
      add: addFault,
      clear: clearFaults,
      list: listFaults,
      loseOrderResponses: loseNextOrderResponses,
    },
    expireSessions: () =>
      updateDb((db) => {
        const past = new Date(Date.now() - 1000).toISOString()
        Object.values(db.sessions).forEach((session) => {
          session.expiresAt = past
        })
      }),
  }
}
