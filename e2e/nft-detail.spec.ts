import { addToCart } from './support/flows'
import { expect, test } from './support/test'

test.describe('detalhe do NFT', () => {
  test('mostra informações principais e navegação estrutural', async ({ page }) => {
    await page.goto('/nfts/nft_001')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('Edição:')).toBeVisible()
    await expect(
      page
        .getByRole('region', { name: 'Galeria de imagens' })
        .or(page.getByLabel('Galeria de imagens')),
    ).toBeVisible()
  })

  test('trocar a edição atualiza o preço exibido', async ({ page }) => {
    await page.goto('/nfts/nft_001')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const priceBefore = await page.locator('main').innerText()

    const radios = page.getByRole('radio')
    const count = await radios.count()
    expect(count).toBeGreaterThan(1)
    await page.locator('label', { hasText: '1/10' }).first().click()

    await expect.poll(async () => page.locator('main').innerText()).not.toBe(priceBefore)
  })

  test('NFT inexistente mostra página de não encontrado', async ({ page }) => {
    await page.goto('/nfts/nft_999')

    await expect(page.getByText('NFT não encontrado')).toBeVisible()
  })

  test('comprar adiciona ao carrinho e leva ao carrinho', async ({ page }) => {
    await addToCart(page, 'nft_001', 2)

    await expect(page.getByRole('group', { name: /^Quantidade de/ })).toContainText('2')
  })

  test('mostra skeleton enquanto o detalhe carrega com latência alta', async ({ page, mocks }) => {
    await page.goto('/')
    await mocks.setScenario('slow')
    await page.goto('/nfts/nft_003')

    await expect(page.locator('[aria-busy="true"]').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  })
})
