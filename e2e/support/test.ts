import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'
import { Mocks, users } from './mocks'

type Credentials = { email: string; password: string }

type Fixtures = {
  mocks: Mocks
  login: (credentials?: Credentials) => Promise<void>
  realtime: {
    waitForStatus: (status: 'online' | 'offline' | 'connecting' | 'idle') => Promise<void>
  }
}

async function waitForRealtime(page: Page, status: string) {
  await page.waitForFunction(
    (expected) => document.documentElement.dataset.realtime === expected,
    status,
    { timeout: 20_000 },
  )
}

export const test = base.extend<Fixtures>({
  mocks: async ({ page }, use) => {
    await use(new Mocks(page))
  },
  login: async ({ page }, use) => {
    await use(async (credentials = users.collector) => {
      await page.goto('/?auth=entrar')
      const dialog = page.getByRole('dialog')
      await dialog.getByPlaceholder('contato@email.com').fill(credentials.email)
      await dialog.getByPlaceholder('Senha').fill(credentials.password)
      await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
      await expect(dialog).toBeHidden()
    })
  },
  realtime: async ({ page }, use) => {
    await use({ waitForStatus: (status) => waitForRealtime(page, status) })
  },
})

export { expect, users }
