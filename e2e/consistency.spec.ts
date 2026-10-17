import {
  addToCart,
  confirmPurchase,
  connectWallet,
  goToCheckout,
  listOrders,
} from './support/flows'
import { expect, test } from './support/test'

test.describe('consistência de dados', () => {
  test('descarta resposta obsoleta quando a consulta mais nova termina antes', async ({
    page,
    mocks,
  }) => {
    await page.goto('/')
    const region = page.getByRole('region', { name: 'Catálogo de NFTs' })
    await expect(region.getByRole('status')).toContainText('de 48 NFTs')

    await mocks.addFault({
      method: 'GET',
      path: '/nfts',
      effect: 'delay',
      delayMs: 3000,
      times: 1,
    })
    await region.getByRole('button', { name: 'Em alta' }).click()
    await region.getByRole('button', { name: 'Novos lançamentos' }).click()

    await expect(page).toHaveURL(/tab=new/)
    await expect(region.getByRole('button', { name: 'Novos lançamentos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const settled = await region.getByRole('status').innerText()

    await page.waitForTimeout(3500)

    await expect(region.getByRole('button', { name: 'Novos lançamentos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(region.getByRole('status')).toHaveText(settled)
    await expect(page).toHaveURL(/tab=new/)
  })

  test('carrinho aberto reflete mudança de preço recebida em tempo real', async ({
    page,
    mocks,
    login,
    realtime,
  }) => {
    await login()
    await addToCart(page, 'nft_001')
    await realtime.waitForStatus('online')
    const summary = page.getByRole('complementary', { name: 'Resumo da carteira' })
    const before = (await summary.innerText()).replace(/\s+/g, ' ')

    await mocks.emitNftUpdate('nft_001', { price: '7.77' })

    await expect.poll(async () => (await summary.innerText()).replace(/\s+/g, ' ')).not.toBe(before)
    await expect(summary).toContainText('7.77')
    await expect(page.getByText(/preço ou disponibilidade atualizados/i).first()).toBeVisible()
  })

  test('o recibo mantém o snapshot do pedido mesmo se o catálogo mudar depois', async ({
    page,
    mocks,
    login,
    realtime,
  }) => {
    await login()
    await addToCart(page, 'nft_001')
    await goToCheckout(page)
    await connectWallet(page)
    await confirmPurchase(page)
    await page.waitForURL('**/pedido/**')
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
    await realtime.waitForStatus('online')
    const receipt = page.getByRole('article')
    const before = (await receipt.innerText()).replace(/\s+/g, ' ')

    await mocks.emitNftUpdate('nft_001', { price: '55.5' })
    await page.waitForTimeout(500)
    await page.reload()

    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
    expect((await receipt.innerText()).replace(/\s+/g, ' ')).toBe(before)
    await expect(receipt).not.toContainText('55.5')
  })

  test('retoma o pedido pendente após queda e volta da conexão sem criar outra compra', async ({
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

    await mocks.goOffline()
    await realtime.waitForStatus('offline')
    await mocks.goOnline()
    await realtime.waitForStatus('online')

    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 20_000,
    })
    expect(await listOrders(page)).toHaveLength(1)
  })

  test('cotação expirada com o passar do tempo é renovada e a compra conclui uma única vez', async ({
    page,
    login,
  }) => {
    await login()
    await addToCart(page, 'nft_001')
    await page.clock.install()
    await goToCheckout(page)
    await connectWallet(page)

    await page.clock.fastForward('00:03:00')
    await confirmPurchase(page)
    await expect(page.getByText('A cotação expirou e foi renovada').first()).toBeVisible()
    await expect(page).toHaveURL(/\/pagamento$/)

    await confirmPurchase(page)

    await page.waitForURL('**/pedido/**')
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
    expect(await listOrders(page)).toHaveLength(1)
  })
})
