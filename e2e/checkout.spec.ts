import {
  addToCart,
  confirmPurchase,
  connectWallet,
  goToCheckout,
  listOrders,
} from './support/flows'
import { expect, test } from './support/test'

test.describe('checkout', () => {
  test('exige conectar a carteira antes de confirmar', async ({ page, login }) => {
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)

    await expect(page.getByRole('button', { name: /^Confirmar/ })).toBeDisabled()

    await connectWallet(page)
    await expect(page.getByRole('button', { name: /^Confirmar/ })).toBeEnabled()
  })

  test('conclui a compra, mostra o recibo e esvazia o carrinho', async ({ page, login }) => {
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)

    await confirmPurchase(page)

    await page.waitForURL('**/pedido/**')
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
    await expect(page.getByText(/ID da transação/)).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Ver no (Etherscan|Polygonscan|Solscan)/ }),
    ).toBeVisible()

    await page.goto('/carrinho')
    await expect(page.getByRole('region', { name: 'Itens do carrinho' })).toHaveCount(0)
  })

  test('clique duplo em confirmar cria um único pedido', async ({ page, login }) => {
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)

    await page.getByRole('button', { name: /^Confirmar/ }).dblclick()

    await page.waitForURL('**/pedido/**')
    expect(await listOrders(page)).toHaveLength(1)
  })

  test('mostra pagamento recusado e mantém os itens no carrinho', async ({
    page,
    mocks,
    login,
  }) => {
    await page.goto('/')
    await mocks.setScenario('payment-declined')
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)

    await confirmPurchase(page)

    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(page.getByRole('region', { name: 'Itens do carrinho' })).toBeVisible()
  })

  test('tentar novamente após recusa volta ao pagamento', async ({ page, mocks, login }) => {
    await page.goto('/')
    await mocks.setScenario('payment-declined')
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)
    await confirmPurchase(page)
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({
      timeout: 15_000,
    })

    await page.getByRole('link', { name: 'Tentar novamente' }).click()

    await expect(page).toHaveURL(/\/pagamento$/)
    await expect(page.getByText('Carteira e rede')).toBeVisible()
  })

  test('carteira que recusa a conexão mostra erro e bloqueia a compra', async ({
    page,
    mocks,
    login,
  }) => {
    await page.goto('/')
    await mocks.setScenario('wallet-refused')
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)

    await page.getByRole('button', { name: 'Conectar carteira' }).click()

    await expect(page.getByRole('alert').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^Confirmar/ })).toBeDisabled()
  })

  test('recarregar durante o processamento retoma o pedido pendente', async ({
    page,
    mocks,
    login,
  }) => {
    await page.goto('/')
    await mocks.setScenario('default')
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)
    await confirmPurchase(page)
    await page.waitForURL('**/pedido/**')
    await expect(page.getByText('Processando seu pedido')).toBeVisible()
    const orderUrl = page.url()

    await page.goto('/pagamento')

    await expect(page).toHaveURL(orderUrl)
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 15_000,
    })
  })

  test('pedido de outro usuário não é acessível', async ({ page, login }) => {
    await login()
    await page.goto('/pedido/order_inexistente')

    await expect(page.getByText('Pedido não encontrado')).toBeVisible()
  })
})
