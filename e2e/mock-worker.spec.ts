import type { Page } from '@playwright/test'
import { expect, test, users } from './support/test'

async function stopServiceWorkers(page: Page) {
  const session = await page.context().newCDPSession(page)
  await session.send('ServiceWorker.enable')
  await session.send('ServiceWorker.stopAllWorkers')
}

test.describe('service worker dos mocks', () => {
  test('continua respondendo depois que o navegador reinicia o worker', async ({ page, mocks }) => {
    await page.goto('/')
    await mocks.ready()
    const region = page.getByRole('region', { name: 'Catálogo de NFTs' })
    await expect(region.getByRole('status')).toContainText('de 48 NFTs')

    await stopServiceWorkers(page)
    await region.getByRole('button', { name: 'Em alta' }).click()

    await expect(region.getByRole('button', { name: 'Em alta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(region.getByRole('status')).toContainText('de 16 NFTs')
    await expect(page.getByText('Não foi possível carregar')).toHaveCount(0)
  })

  test('permite entrar mesmo com o worker reiniciado', async ({ page, mocks }) => {
    await page.goto('/?auth=entrar')
    await mocks.ready()
    await stopServiceWorkers(page)

    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder('contato@email.com').fill(users.collector.email)
    await dialog.getByPlaceholder('Senha').fill(users.collector.password)
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(dialog).toBeHidden()
  })
})
