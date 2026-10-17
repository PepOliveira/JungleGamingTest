import {
  addToCart,
  confirmPurchase,
  connectWallet,
  goToCheckout,
  listOrders,
} from './support/flows'
import { expect, test } from './support/test'

const slow = { timeout: 20_000 }

test.describe('falhas de rede e de servidor', () => {
  test('mostra erro e se recupera depois de um 500 no catálogo', async ({ page, mocks }) => {
    await page.goto('/')
    await mocks.addFault({ method: 'GET', path: '/nfts', effect: 'status', status: 500 })
    await page.goto('/')

    await expect(
      page.getByRole('alert').filter({ hasText: 'Não foi possível carregar' }).first(),
    ).toBeVisible(slow)

    await mocks.clearFaults()
    await page.getByRole('button', { name: 'Tentar novamente' }).first().click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Não foi possível carregar' }),
    ).toHaveCount(0)
  })

  test('trata falha de conexão no detalhe do NFT', async ({ page, mocks }) => {
    await page.goto('/')
    await mocks.addFault({ method: 'GET', path: '/nfts/nft_001', effect: 'network' })
    await page.goto('/nfts/nft_001')

    await expect(page.getByText('Não foi possível carregar este NFT')).toBeVisible(slow)

    await mocks.clearFaults()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('trata timeout de requisição', async ({ page, mocks }) => {
    await page.goto('/')
    await mocks.addFault({ method: 'GET', path: '/nfts/nft_002', effect: 'timeout' })
    await page.goto('/nfts/nft_002')

    await expect(page.getByText('Não foi possível carregar este NFT')).toBeVisible({
      timeout: 30_000,
    })
  })

  test('não repete requisições com erro de validação (4xx)', async ({ page, mocks, login }) => {
    await login()
    await mocks.addFault({
      method: 'GET',
      path: '/cart',
      effect: 'status',
      status: 422,
      code: 'validation_error',
      times: 1,
    })
    await page.goto('/carrinho')

    await expect(page.getByText('Não foi possível carregar o carrinho')).toBeVisible()
  })
})

test.describe('sessão expirada', () => {
  test('pede login novamente e mantém o destino', async ({ page, mocks, login }) => {
    await login()
    await page.goto('/nfts/nft_001')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await mocks.expireSessions()

    await page.getByRole('button', { name: /^Comprar( NFT)?$/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Sua sessão expirou')).toBeVisible()
    await expect(page).toHaveURL(/motivo=sessao-expirada/)
    await expect(page).toHaveURL(/retorno=.*nfts/)

    await dialog.getByPlaceholder('contato@email.com').fill('colecionador@kurio.dev')
    await dialog.getByPlaceholder('Senha').fill('Kurio@123')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/nfts\/nft_001$/)
  })
})

test.describe('cupons', () => {
  test('rejeita cupom inválido e expirado e aceita um válido', async ({ page, login }) => {
    await login()
    await addToCart(page, 'nft_001')
    const field = page.getByLabel('Código promocional')

    await field.fill('NAOEXISTE')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: /inválid|não encontrad|existe/i }),
    ).toBeVisible()

    await field.fill('EXPIRADO20')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: /expirou|expirad/i })).toBeVisible()

    await field.fill('KURIO10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Cupom KURIO10 aplicado').first()).toBeVisible()
  })
})

test.describe('compra', () => {
  test('recupera com idempotência quando a resposta do pedido se perde', async ({
    page,
    mocks,
    login,
  }) => {
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)

    await mocks.loseOrderResponses(1)
    await confirmPurchase(page)

    await page.waitForURL('**/pedido/**', { timeout: 30_000 })
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible(slow)
    expect(await listOrders(page)).toHaveLength(1)
  })

  test('avisa quando o preço muda durante a compra', async ({ page, mocks, login, realtime }) => {
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)
    await realtime.waitForStatus('online')

    await mocks.emitNftUpdate('nft_001', { price: '0.77' })

    await expect(page.getByText(/valores do pedido mudaram|novos valores/i).first()).toBeVisible(
      slow,
    )
    await expect(page.getByRole('button', { name: 'Confirmar com os novos valores' })).toBeEnabled()
  })

  test('bloqueia a compra quando o item esgota durante o pagamento', async ({
    page,
    mocks,
    login,
    realtime,
  }) => {
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)
    await realtime.waitForStatus('online')

    await mocks.emitNftUpdate('nft_001', { available: 0 })
    await page.reload()

    await expect(page.getByRole('button', { name: /^Confirmar/ })).toBeDisabled()
  })
})
