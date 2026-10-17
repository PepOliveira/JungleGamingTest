import { addToCart } from './support/flows'
import { expect, test, users } from './support/test'

test.describe('teclado e foco', () => {
  test('link de pular conteúdo é o primeiro foco e leva ao conteúdo principal', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Catálogo de NFTs' })).toBeVisible()

    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.locator('main')).toBeFocused()
  })

  test('diálogo de login prende o foco, fecha com Esc e devolve o foco', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile === true, 'Gatilho de login fica no cabeçalho desktop')
    await page.goto('/')
    const trigger = page.getByRole('link', { name: 'Entrar' })
    await trigger.focus()

    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(/auth=entrar/)

    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab')
      const inside = await dialog.evaluate((element) => element.contains(document.activeElement))
      expect(inside).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/auth=/)
    await expect(trigger).toBeFocused()
  })

  test('envio inválido leva o foco ao primeiro campo com erro', async ({ page }) => {
    await page.goto('/?auth=entrar')
    const dialog = page.getByRole('dialog')

    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(dialog.getByPlaceholder('contato@email.com')).toBeFocused()
    await expect(dialog.getByPlaceholder('contato@email.com')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  test('formulário de login é totalmente operável pelo teclado', async ({ page }) => {
    await page.goto('/?auth=entrar')
    const dialog = page.getByRole('dialog')

    await dialog.getByPlaceholder('contato@email.com').focus()
    await page.keyboard.type(users.collector.email)
    await page.keyboard.press('Tab')
    await page.keyboard.type(users.collector.password)
    await page.keyboard.press('Enter')

    await expect(dialog).toBeHidden()
  })

  test('opções de edição respondem às setas do teclado', async ({ page }) => {
    await page.goto('/nfts/nft_001')
    await expect(page.getByText('Edição:')).toBeVisible()
    const radios = page.getByRole('radio')
    await radios.first().focus()
    const before = await radios.evaluateAll((items) =>
      items.map((item) => (item as HTMLInputElement).checked),
    )

    await page.keyboard.press('ArrowRight')

    const after = await radios.evaluateAll((items) =>
      items.map((item) => (item as HTMLInputElement).checked),
    )
    expect(after).not.toEqual(before)
  })

  test('controles de quantidade do carrinho funcionam com teclado', async ({ page }) => {
    await addToCart(page, 'nft_001')
    const group = page.getByRole('group', { name: /^Quantidade de/ })
    const increase = group.getByRole('button', { name: 'Aumentar quantidade' })

    await increase.focus()
    await page.keyboard.press('Enter')

    await expect(group).toContainText('2')
    await page.keyboard.press('Space')
    await expect(group).toContainText('3')
  })

  test('painel de filtros no mobile fecha com Esc e devolve o foco', async ({ page, isMobile }) => {
    test.skip(isMobile !== true, 'O painel de filtros é um sheet apenas no mobile')
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Abrir filtros' })
    await trigger.focus()

    await page.keyboard.press('Enter')
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('elementos interativos mostram indicador de foco visível', async ({ page }) => {
    await page.goto('/nfts/nft_001')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const buy = page.getByRole('button', { name: /^Comprar( NFT)?$/ })
    await buy.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')

    const indicator = await buy.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
        shadow: style.boxShadow !== 'none',
      }
    })
    expect(indicator.outline || indicator.shadow).toBe(true)
  })
})

test.describe('movimento reduzido', () => {
  test('o shimmer do skeleton respeita prefers-reduced-motion', async ({ page, mocks }) => {
    await page.goto('/')
    await mocks.setScenario('slow')

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/nfts/nft_003')
    const animated = await page
      .locator('.skeleton')
      .first()
      .evaluate((element) => {
        return getComputedStyle(element, '::after').animationName
      })
    expect(animated).toBe('shimmer')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    const still = await page
      .locator('.skeleton')
      .first()
      .evaluate((element) => {
        return getComputedStyle(element, '::after').animationName
      })
    expect(still).toBe('none')
  })
})
