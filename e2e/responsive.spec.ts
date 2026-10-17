import type { Page } from '@playwright/test'
import { addToCart, confirmPurchase, connectWallet, goToCheckout } from './support/flows'
import { expect, test } from './support/test'

const widths = [
  { name: 'reflow-320', width: 320, height: 640 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
] as const

async function expectNoHorizontalOverflow(page: Page, label: string) {
  await page.waitForLoadState('networkidle')
  const overflow = await page.evaluate(() => {
    const root = document.documentElement
    return root.scrollWidth - root.clientWidth
  })
  expect(overflow, `${label} não deve ter rolagem horizontal`).toBeLessThanOrEqual(1)
}

for (const viewport of widths) {
  test.describe(`sem overflow horizontal em ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('telas públicas', async ({ page }) => {
      for (const path of [
        '/',
        '/?tab=trending&page=2',
        '/nfts/nft_001',
        '/nfts/nft_999',
        '/?auth=entrar',
        '/?auth=cadastro',
        '/indisponivel?secao=blog',
        '/rota-que-nao-existe',
      ]) {
        await page.goto(path)
        await expect(page.locator('main')).toBeVisible()
        await expectNoHorizontalOverflow(page, path)
      }
    })

    test('carrinho, pagamento, recibo, perfil e carteiras', async ({ page, login }) => {
      await login()
      await addToCart(page, 'nft_001', 2)
      await expectNoHorizontalOverflow(page, '/carrinho')

      await goToCheckout(page)
      await connectWallet(page)
      await expectNoHorizontalOverflow(page, '/pagamento')

      await confirmPurchase(page)
      await page.waitForURL('**/pedido/**')
      await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
      await expectNoHorizontalOverflow(page, '/pedido')

      for (const path of ['/perfil', '/perfil/carteiras']) {
        await page.goto(path)
        await expect(page.locator('main')).toBeVisible()
        await expectNoHorizontalOverflow(page, path)
      }
    })
  })
}
