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

  test('edição esgotada não pode ser selecionada', async ({ page, mocks }) => {
    await page.goto('/')
    await mocks.ready()
    const id = await page.evaluate(async () => {
      for (let index = 1; index <= 48; index += 1) {
        const key = `nft_${String(index).padStart(3, '0')}`
        const response = await fetch(`/api/nfts/${key}`)
        const nft = (await response.json()) as { editions: Array<{ available: number }> }
        if (
          nft.editions.some((edition) => edition.available === 0) &&
          nft.editions.some((edition) => edition.available > 0)
        ) {
          return key
        }
      }
      return null
    })
    expect(id).not.toBeNull()

    await page.goto(`/nfts/${id}`)

    await expect(page.getByText('Edição:')).toBeVisible()
    await expect(page.getByRole('radio', { disabled: true }).first()).toBeDisabled()
    await expect(page.getByRole('radio', { checked: true })).toBeEnabled()
  })

  test('limita a quantidade ao máximo permitido e informa o limite', async ({ page }) => {
    await page.goto('/nfts/nft_001')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const increase = page.getByRole('button', { name: 'Aumentar quantidade' }).first()

    for (let step = 0; step < 14 && (await increase.isEnabled()); step += 1) {
      await increase.click()
    }

    await expect(increase).toBeDisabled()
    await expect(
      page.locator('p:visible').filter({ hasText: /Limite de \d+ unidades? para esta edição/ }),
    ).toBeVisible()
    const value = await page.getByRole('spinbutton').first().inputValue()
    expect(Number(value)).toBeLessThanOrEqual(10)
  })
})
