import type { Page } from '@playwright/test'
import { expect, test } from './support/test'

const results = (page: Page) => page.getByRole('region', { name: 'Catálogo de NFTs' })

test.describe('catálogo', () => {
  test('restaura aba, página e filtros a partir da URL', async ({ page }) => {
    await page.goto('/?tab=trending&page=2')

    await expect(results(page).getByRole('button', { name: 'Em alta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(results(page).getByRole('status')).toContainText('10–16 de 16')
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('troca de aba atualiza a URL e volta ao usar o histórico do navegador', async ({ page }) => {
    await page.goto('/')
    await expect(results(page).getByRole('status')).toContainText('de 48 NFTs')

    await results(page).getByRole('button', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/tab=trending/)
    await expect(results(page).getByRole('status')).toContainText('de 16 NFTs')

    await page.goBack()
    await expect(page).not.toHaveURL(/tab=trending/)
    await expect(results(page).getByRole('status')).toContainText('de 48 NFTs')
  })

  test('paginação preserva os demais parâmetros', async ({ page }) => {
    await page.goto('/?tab=trending')

    await page.getByRole('link', { name: 'Próxima página' }).click()

    await expect(page).toHaveURL(/tab=trending/)
    await expect(page).toHaveURL(/page=2/)
    await expect(results(page).getByRole('status')).toContainText('10–16 de 16')
  })

  test('filtro por coleção usa a URL como fonte da verdade', async ({ page, isMobile }) => {
    test.skip(isMobile === true, 'No mobile os filtros ficam em um painel lateral')
    await page.goto('/')

    await page
      .getByRole('complementary', { name: 'Filtros' })
      .getByRole('button', { name: /^Música/ })
      .click()

    await expect(page).toHaveURL(/collections=/)
    await expect(results(page).getByRole('status')).toContainText('de 5 NFTs')

    await page.reload()
    await expect(results(page).getByRole('status')).toContainText('de 5 NFTs')
  })

  test('busca por texto filtra os resultados', async ({ page }) => {
    await page.goto('/?q=Emerald')

    const list = results(page).getByRole('list').first()
    await expect(list.getByRole('heading', { level: 3 }).first()).toContainText('Emerald')
    const names = await list.getByRole('heading', { level: 3 }).allInnerTexts()
    expect(names.length).toBeGreaterThan(0)
    expect(names.every((name) => name.includes('Emerald'))).toBe(true)
  })

  test('mostra estado vazio quando nenhum NFT corresponde', async ({ page }) => {
    await page.goto('/?q=zzzz-sem-resultado')

    await expect(
      results(page).getByText(/nenhum nft|nada encontrado|sem resultados/i),
    ).toBeVisible()
  })

  test('abre o detalhe a partir de um card', async ({ page }) => {
    await page.goto('/?tab=trending')

    await results(page)
      .getByRole('link', { name: /Sage Nomad #009/ })
      .click()

    await expect(page).toHaveURL(/\/nfts\/nft_002$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sage Nomad #009')
  })

  test('rota inexistente mostra a página de não encontrado', async ({ page }) => {
    await page.goto('/rota-que-nao-existe')

    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  })
})
