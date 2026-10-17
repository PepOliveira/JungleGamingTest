import type { Page } from '@playwright/test'
import { addToCart, connectWallet, goToCheckout } from './support/flows'
import { expect, test } from './support/test'

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
] as const

async function stabilize(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    const images = Array.from(document.images)
    images.forEach((image) => {
      image.loading = 'eager'
    })
    const settle = (image: HTMLImageElement) =>
      image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true })
            image.addEventListener('error', () => resolve(), { once: true })
          })
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 8000))
    await Promise.race([Promise.all(images.map(settle)), timeout])
  })
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
  })
}

for (const viewport of viewports) {
  test.describe(`visual ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('home', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('region', { name: 'Catálogo de NFTs' })).toBeVisible()
      await stabilize(page)

      await expect(page).toHaveScreenshot(`home-${viewport.name}.png`, { fullPage: true })
    })

    test('detalhe do NFT', async ({ page }) => {
      await page.goto('/nfts/nft_001')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await stabilize(page)

      await expect(page).toHaveScreenshot(`detalhe-${viewport.name}.png`, { fullPage: true })
    })

    test('carrinho', async ({ page }) => {
      await addToCart(page, 'nft_001', 2)
      await stabilize(page)

      await expect(page).toHaveScreenshot(`carrinho-${viewport.name}.png`, { fullPage: true })
    })

    test('pagamento', async ({ page, login }) => {
      await login()
      await addToCart(page, 'nft_001')
      await goToCheckout(page)
      await connectWallet(page)
      await stabilize(page)

      await expect(page).toHaveScreenshot(`pagamento-${viewport.name}.png`, { fullPage: true })
    })

    test('diálogo de login', async ({ page }) => {
      await page.goto('/?auth=entrar')
      await expect(page.getByRole('dialog')).toBeVisible()
      await stabilize(page)

      await expect(page).toHaveScreenshot(`login-${viewport.name}.png`)
    })
  })
}
