import type { Page } from '@playwright/test'

export type ScenarioName = 'default' | 'instant' | 'slow' | 'payment-declined' | 'wallet-refused'

export type FaultInput = {
  method?: string
  path: string
  effect: 'status' | 'network' | 'timeout'
  status?: number
  code?: string
  message?: string
  times?: number
}

export type NftPatch = { price?: string; available?: number }

type KurioMocks = {
  reset: () => void
  setScenario: (name: string) => void
  expireSessions: () => void
  faults: {
    add: (fault: FaultInput) => void
    clear: () => void
    loseOrderResponses: (times: number) => void
  }
  realtime: {
    emitNftUpdate: (nftId: string, patch: NftPatch) => unknown
    emitStaleNftUpdate: (nftId: string) => unknown
    emitForeignOrderUpdate: (orderId: string) => unknown
    replayLastEvent: () => void
    disconnect: () => void
    goOffline: () => void
    goOnline: () => void
  }
}

type MockWindow = Window & { __KURIO_MOCKS__?: KurioMocks }

export const users = {
  collector: { email: 'colecionador@kurio.dev', password: 'Kurio@123', name: 'Marina' },
  creator: { email: 'criadora@kurio.dev', password: 'Kurio@456', name: 'Rafael' },
} as const

export class Mocks {
  constructor(private readonly page: Page) {}

  async ready() {
    await this.page.waitForFunction(() => Boolean((window as MockWindow).__KURIO_MOCKS__))
  }

  async reset() {
    await this.ready()
    await this.page.evaluate(() => (window as MockWindow).__KURIO_MOCKS__!.reset())
  }

  async setScenario(name: ScenarioName) {
    await this.ready()
    await this.page.evaluate(
      (scenario) => (window as MockWindow).__KURIO_MOCKS__!.setScenario(scenario),
      name,
    )
  }

  async addFault(fault: FaultInput) {
    await this.ready()
    await this.page.evaluate(
      (input) => (window as MockWindow).__KURIO_MOCKS__!.faults.add(input),
      fault,
    )
  }

  async clearFaults() {
    await this.ready()
    await this.page.evaluate(() => (window as MockWindow).__KURIO_MOCKS__!.faults.clear())
  }

  async loseOrderResponses(times: number) {
    await this.ready()
    await this.page.evaluate(
      (count) => (window as MockWindow).__KURIO_MOCKS__!.faults.loseOrderResponses(count),
      times,
    )
  }

  async expireSessions() {
    await this.ready()
    await this.page.evaluate(() => (window as MockWindow).__KURIO_MOCKS__!.expireSessions())
  }

  async emitNftUpdate(nftId: string, patch: NftPatch) {
    await this.ready()
    await this.page.evaluate(
      ([id, change]) => (window as MockWindow).__KURIO_MOCKS__!.realtime.emitNftUpdate(id, change),
      [nftId, patch] as const,
    )
  }

  async emitStaleNftUpdate(nftId: string) {
    await this.ready()
    await this.page.evaluate(
      (id) => (window as MockWindow).__KURIO_MOCKS__!.realtime.emitStaleNftUpdate(id),
      nftId,
    )
  }

  async emitForeignOrderUpdate(orderId: string) {
    await this.ready()
    await this.page.evaluate(
      (id) => (window as MockWindow).__KURIO_MOCKS__!.realtime.emitForeignOrderUpdate(id),
      orderId,
    )
  }

  async replayLastEvent() {
    await this.ready()
    await this.page.evaluate(() =>
      (window as MockWindow).__KURIO_MOCKS__!.realtime.replayLastEvent(),
    )
  }

  async goOffline() {
    await this.ready()
    await this.page.evaluate(() => (window as MockWindow).__KURIO_MOCKS__!.realtime.goOffline())
  }

  async goOnline() {
    await this.ready()
    await this.page.evaluate(() => (window as MockWindow).__KURIO_MOCKS__!.realtime.goOnline())
  }
}
