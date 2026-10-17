import { addToCart, confirmPurchase, connectWallet, goToCheckout } from './support/flows'
import { expect, test, users } from './support/test'

test.describe('sessão e isolamento entre usuários', () => {
  test('trocar de usuário não expõe dados privados do anterior', async ({ page, login }) => {
    await login(users.collector)
    await page.goto('/')
    const region = page.getByRole('region', { name: 'Catálogo de NFTs' })
    await expect(region.getByRole('button', { name: /dos favoritos$/ }).first()).toBeVisible()
    await addToCart(page, 'nft_001')

    await page.evaluate(() => localStorage.removeItem('kurio:session'))
    await page.reload()
    await login(users.creator)

    await page.goto('/carrinho')
    await expect(page.getByRole('region', { name: 'Itens do carrinho' })).toHaveCount(0)
    await page.goto('/perfil')
    await expect(page.getByLabel('Nome de exibição')).toHaveValue(
      users.creator.name === 'Rafael' ? 'Rafael Lima' : '',
    )
    await expect(page.locator('main').getByLabel(/^E-mail/)).toHaveValue(users.creator.email)
    await page.goto('/')
    await expect(
      page
        .getByRole('region', { name: 'Catálogo de NFTs' })
        .getByRole('button', { name: /dos favoritos$/ }),
    ).toHaveCount(0)
  })

  test('logout limpa dados privados e bloqueia as rotas protegidas', async ({
    page,
    login,
    isMobile,
  }) => {
    test.skip(isMobile === true, 'Menu da conta fica no cabeçalho desktop')
    await login()
    await page.goto('/perfil')
    await expect(page.getByLabel('Nome de exibição')).toBeVisible()

    await page.getByRole('button', { name: /Abrir menu da conta/ }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()

    await page.goto('/perfil')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page).toHaveURL(/auth=entrar/)
  })

  test('expiração durante o checkout preserva o contexto e permite retomar a compra', async ({
    page,
    mocks,
    login,
  }) => {
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)

    await mocks.expireSessions()
    await confirmPurchase(page)

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Sua sessão expirou')).toBeVisible()
    await expect(page).toHaveURL(/retorno=.*pagamento/)

    await dialog.getByPlaceholder('contato@email.com').fill(users.collector.email)
    await dialog.getByPlaceholder('Senha').fill(users.collector.password)
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/pagamento$/)

    await connectWallet(page)
    await confirmPurchase(page)
    await page.waitForURL('**/pedido/**')
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
  })

  test('a sessão é recuperada após recarregar durante a navegação', async ({ page, login }) => {
    await login()
    await page.goto('/perfil/carteiras')

    await page.reload()

    await expect(page).toHaveURL(/\/perfil\/carteiras$/)
    await expect(page.getByRole('heading', { name: /Carteira principal/i })).toBeVisible()
  })

  test('o reset dos mocks restaura o cenário conhecido', async ({ page, mocks, login }) => {
    await login()
    await addToCart(page, 'nft_001')
    await page.goto('/carrinho')
    await expect(page.getByRole('region', { name: 'Itens do carrinho' })).toBeVisible()

    await mocks.reset()
    await page.evaluate(() => localStorage.removeItem('kurio:session'))
    await page.reload()
    await login()

    await page.goto('/carrinho')
    await expect(page.getByRole('region', { name: 'Itens do carrinho' })).toHaveCount(0)
    await page.goto('/')
    await expect(
      page
        .getByRole('region', { name: 'Catálogo de NFTs' })
        .getByRole('button', { name: /dos favoritos$/ })
        .first(),
    ).toBeVisible()
  })
})
