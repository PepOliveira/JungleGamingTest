import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export async function addToCart(page: Page, nftId: string, quantity = 1) {
  await page.goto(`/nfts/${nftId}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  for (let step = 1; step < quantity; step += 1) {
    await page.getByRole('button', { name: 'Aumentar quantidade' }).first().click()
  }
  await page.getByRole('button', { name: /^Comprar( NFT)?$/ }).click()
  await page.waitForURL('**/carrinho')
  await expect(page.getByRole('region', { name: 'Itens do carrinho' })).toBeVisible()
}

export async function goToCheckout(page: Page) {
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await page.waitForURL('**/pagamento')
  await expect(page.getByText('Carteira e rede')).toBeVisible()
}

export async function connectWallet(page: Page) {
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada:')).toBeVisible()
}

export async function confirmPurchase(page: Page) {
  await page.getByRole('button', { name: /^Confirmar/ }).click()
}

export async function listOrders(page: Page) {
  return page.evaluate(async () => {
    const stored = localStorage.getItem('kurio:session')
    const token = stored ? (JSON.parse(stored) as { accessToken: string }).accessToken : ''
    const response = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
    const body = (await response.json()) as { items: Array<{ id: string; status: string }> }
    return body.items
  })
}
