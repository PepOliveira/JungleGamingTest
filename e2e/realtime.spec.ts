import { addToCart, confirmPurchase, connectWallet, goToCheckout } from './support/flows'
import { expect, test } from './support/test'

test.describe('tempo real', () => {
  test('atualiza o preço do detalhe ao receber nft.updated', async ({ page, mocks, realtime }) => {
    await page.goto('/nfts/nft_001')
    await realtime.waitForStatus('online')

    await mocks.emitNftUpdate('nft_001', { price: '9.99' })

    await expect(page.locator('main')).toContainText('9.99')
  })

  test('atualiza os cards do catálogo sem recarregar', async ({ page, mocks, realtime }) => {
    await page.goto('/?q=Emerald')
    await realtime.waitForStatus('online')
    const list = page.getByRole('region', { name: 'Catálogo de NFTs' })
    const first = list.getByRole('listitem').first().getByRole('link')
    const name = (await first.getByRole('heading', { level: 3 }).innerText()).trim()
    const id = ((await first.getAttribute('href')) ?? '').split('/').pop() ?? ''

    await mocks.emitNftUpdate(id, { price: '7.77' })

    await expect(list.getByRole('link', { name: new RegExp(`${name}.*7\\.77`) })).toBeVisible()
  })

  test('ignora eventos antigos e repetidos', async ({ page, mocks, realtime }) => {
    await page.goto('/nfts/nft_001')
    await realtime.waitForStatus('online')

    await mocks.emitNftUpdate('nft_001', { price: '9.99' })
    await expect(page.locator('main')).toContainText('9.99')

    await mocks.emitStaleNftUpdate('nft_001')
    await mocks.replayLastEvent()
    await page.waitForTimeout(500)

    await expect(page.locator('main')).toContainText('9.99')
    await expect(page.locator('main')).not.toContainText('0.001')
  })

  test('não aplica eventos de pedido de outro usuário', async ({
    page,
    mocks,
    login,
    realtime,
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
    await realtime.waitForStatus('online')
    const orderId = page.url().split('/').pop() ?? ''

    await mocks.emitForeignOrderUpdate(orderId)
    await page.waitForTimeout(400)

    await expect(page.getByText('Processando seu pedido')).toBeVisible()
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 15_000,
    })
  })

  test('avisa a queda da conexão e reconcilia dados ao reconectar', async ({
    page,
    mocks,
    realtime,
  }) => {
    await page.goto('/nfts/nft_001')
    await realtime.waitForStatus('online')

    await mocks.goOffline()
    await realtime.waitForStatus('offline')
    await expect(page.getByText('Atualizações em tempo real indisponíveis').first()).toBeVisible()

    await mocks.emitNftUpdate('nft_001', { price: '5.55' })
    await expect(page.locator('main')).not.toContainText('5.55')

    await mocks.goOnline()
    await realtime.waitForStatus('online')

    await expect(page.locator('main')).toContainText('5.55', { timeout: 15_000 })
  })

  test('encerra a conexão do usuário ao sair e reabre como visitante', async ({
    page,
    login,
    realtime,
    isMobile,
  }) => {
    test.skip(isMobile === true, 'Menu da conta fica no cabeçalho desktop')
    await login()
    await realtime.waitForStatus('online')

    await page.getByRole('button', { name: /Abrir menu da conta/ }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()

    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    await realtime.waitForStatus('online')
  })

  test('o evento order.updated confirma o pedido mesmo sem o polling da API', async ({
    page,
    mocks,
    login,
    realtime,
  }) => {
    await page.goto('/')
    await mocks.setScenario('default')
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)
    await realtime.waitForStatus('online')
    await confirmPurchase(page)
    await page.waitForURL('**/pedido/**')
    await expect(page.getByText('Processando seu pedido')).toBeVisible()

    await mocks.addFault({ method: 'GET', path: '/orders/', effect: 'delay', delayMs: 30_000 })

    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 10_000,
    })
  })
})
