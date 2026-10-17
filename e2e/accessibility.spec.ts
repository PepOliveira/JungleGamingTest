import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { addToCart, confirmPurchase, connectWallet, goToCheckout } from './support/flows'
import { expect, test } from './support/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
  }))
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
}

test.describe('acessibilidade (axe)', () => {
  test('home e catálogo', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Catálogo de NFTs' })).toBeVisible()
    await settle(page)

    expect(await scan(page)).toEqual([])
  })

  test('detalhe do NFT', async ({ page }) => {
    await page.goto('/nfts/nft_001')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await settle(page)

    expect(await scan(page)).toEqual([])
  })

  test('diálogo de login', async ({ page }) => {
    await page.goto('/?auth=entrar')
    await expect(page.getByRole('dialog')).toBeVisible()
    await settle(page)

    expect(await scan(page)).toEqual([])
  })

  test('diálogo de cadastro com erros de validação', async ({ page }) => {
    await page.goto('/?auth=cadastro')
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Criar conta', exact: true }).last().click()
    await expect(dialog.getByRole('alert').first()).toBeVisible()

    expect(await scan(page)).toEqual([])
  })

  test('carrinho', async ({ page }) => {
    await addToCart(page, 'nft_001')
    await settle(page)

    expect(await scan(page)).toEqual([])
  })

  test('pagamento', async ({ page, login }) => {
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)
    await settle(page)

    expect(await scan(page)).toEqual([])
  })

  test('recibo do pedido', async ({ page, login }) => {
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)
    await confirmPurchase(page)
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()

    expect(await scan(page)).toEqual([])
  })

  test('perfil e carteiras', async ({ page, login }) => {
    await login()
    await page.goto('/perfil')
    await expect(page.getByLabel('Nome de exibição')).toBeVisible()
    expect(await scan(page)).toEqual([])

    await page.goto('/perfil/carteiras')
    await expect(page.getByRole('heading', { name: /Carteira principal/i })).toBeVisible()
    expect(await scan(page)).toEqual([])
  })

  test('páginas de erro e indisponível', async ({ page }) => {
    await page.goto('/nfts/nft_999')
    await expect(page.getByText('NFT não encontrado')).toBeVisible()
    expect(await scan(page)).toEqual([])

    await page.goto('/indisponivel?secao=blog')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await scan(page)).toEqual([])
  })
})
