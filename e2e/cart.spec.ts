import type { Page } from '@playwright/test'
import { addToCart } from './support/flows'
import { expect, test, users } from './support/test'

const totalOf = async (page: Page) =>
  (await page.getByRole('complementary', { name: 'Resumo da carteira' }).innerText()).replace(
    /\s+/g,
    ' ',
  )

test.describe('carrinho', () => {
  test('visitante monta o carrinho e ele é mesclado ao entrar', async ({ page }) => {
    await addToCart(page, 'nft_001')
    await expect(page.getByRole('region', { name: 'Itens do carrinho' })).toContainText('#')

    await page.goto('/?auth=entrar')
    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder('contato@email.com').fill(users.collector.email)
    await dialog.getByPlaceholder('Senha').fill(users.collector.password)
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog).toBeHidden()

    await page.goto('/carrinho')
    await expect(
      page.getByRole('region', { name: 'Itens do carrinho' }).getByRole('listitem'),
    ).toHaveCount(1)
  })

  test('alterar quantidade recalcula o total pela API', async ({ page }) => {
    await addToCart(page, 'nft_001')
    const before = await totalOf(page)

    await page.getByRole('button', { name: 'Aumentar quantidade' }).first().click()

    await expect.poll(() => totalOf(page)).not.toBe(before)
  })

  test('remover o último item mostra o carrinho vazio', async ({ page }) => {
    await addToCart(page, 'nft_001')

    await page
      .getByRole('button', { name: /^Remover .* do carrinho$/ })
      .first()
      .click()

    await expect(page.getByText(/carrinho está vazio|vazio/i).first()).toBeVisible()
  })

  test('remover um cupom volta ao total anterior', async ({ page }) => {
    await addToCart(page, 'nft_001')
    const before = await totalOf(page)

    await page.getByLabel('Código promocional').fill('KURIO10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Cupom KURIO10 aplicado').first()).toBeVisible()
    await expect.poll(() => totalOf(page)).not.toBe(before)

    await page.getByRole('button', { name: /Remover cupom/ }).click()
    await expect.poll(() => totalOf(page)).toBe(before)
  })

  test('o carrinho persiste após recarregar a página', async ({ page }) => {
    await addToCart(page, 'nft_002')

    await page.reload()

    await expect(
      page.getByRole('region', { name: 'Itens do carrinho' }).getByRole('listitem'),
    ).toHaveCount(1)
  })

  test('mostra o skeleton enquanto carrega e depois o conteúdo', async ({ page, mocks }) => {
    await addToCart(page, 'nft_001')
    await mocks.setScenario('slow')
    await page.reload()

    await expect(page.locator('[aria-busy="true"]').first()).toBeVisible()
    await expect(page.getByRole('region', { name: 'Itens do carrinho' })).toBeVisible({
      timeout: 15_000,
    })
  })
})
