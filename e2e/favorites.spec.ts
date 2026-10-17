import type { Page } from '@playwright/test'
import { expect, test } from './support/test'

const card = (page: Page) => page.getByRole('region', { name: 'Catálogo de NFTs' })

test.describe('favoritos', () => {
  test('visitante é levado ao login ao favoritar', async ({ page }) => {
    await page.goto('/?tab=trending')

    await card(page)
      .getByRole('button', { name: /^Favoritar / })
      .first()
      .click()

    await expect(page).toHaveURL(/auth=entrar/)
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('favoritar e desfavoritar persiste após recarregar', async ({ page, login }) => {
    await login()
    await page.goto('/?tab=trending')
    const first = card(page)
      .getByRole('button', { name: /^Favoritar / })
      .first()
    const label = (await first.getAttribute('aria-label')) ?? ''
    const name = label.replace(/^Favoritar /, '')

    await first.click()
    await expect(
      card(page).getByRole('button', { name: `Remover ${name} dos favoritos` }),
    ).toBeVisible()

    await page.reload()
    const added = card(page).getByRole('button', { name: `Remover ${name} dos favoritos` })
    await expect(added).toBeVisible()

    await added.click()
    await expect(card(page).getByRole('button', { name: `Favoritar ${name}` })).toBeVisible()
  })

  test('reverte a atualização otimista quando a API falha', async ({ page, mocks, login }) => {
    await login()
    await page.goto('/?tab=trending')
    const first = card(page)
      .getByRole('button', { name: /^Favoritar / })
      .first()
    const name = ((await first.getAttribute('aria-label')) ?? '').replace(/^Favoritar /, '')

    await mocks.addFault({ method: 'PUT', path: '/favorites', effect: 'status', status: 500 })
    await mocks.addFault({ method: 'POST', path: '/favorites', effect: 'status', status: 500 })
    await first.click()

    await expect(card(page).getByRole('button', { name: `Favoritar ${name}` })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/Não foi possível favoritar/).first()).toBeVisible()
  })

  test('favoritos iniciais do colecionador aparecem marcados', async ({ page, login }) => {
    await login()
    await page.goto('/')

    await expect(page.getByRole('button', { name: /dos favoritos$/ }).first()).toBeVisible()
  })
})
