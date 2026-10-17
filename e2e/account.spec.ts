import { expect, test, users } from './support/test'

test.describe('perfil', () => {
  test('atualiza o nome e reflete no cabeçalho após recarregar', async ({
    page,
    login,
    isMobile,
  }) => {
    await login()
    await page.goto('/perfil')

    const name = page.getByLabel('Nome de exibição')
    await name.fill('Marina Souza')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByRole('status').filter({ hasText: 'Perfil atualizado' })).toBeAttached()
    await page.reload()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Marina Souza')
    if (!isMobile) {
      await expect(page.getByRole('button', { name: /Abrir menu da conta/ })).toContainText(
        'Marina Souza',
      )
    }
  })

  test('valida e-mail inválido sem chamar a API', async ({ page, login }) => {
    await login()
    await page.goto('/perfil')

    await page
      .locator('main')
      .getByLabel(/^E-mail/)
      .fill('isto-nao-e-email')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByRole('alert').first()).toBeVisible()
  })

  test('altera a senha e permite entrar com a nova', async ({ page, login }) => {
    await login()
    await page.goto('/perfil')

    await page.getByLabel('Senha atual', { exact: true }).fill(users.collector.password)
    await page.getByLabel('Nova senha', { exact: true }).fill('Kurio@999')
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Kurio@999')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByRole('status').filter({ hasText: 'Perfil atualizado' })).toBeAttached()

    await page.evaluate(() => localStorage.removeItem('kurio:session'))
    await login({ email: users.collector.email, password: 'Kurio@999' })
    await expect(page).not.toHaveURL(/auth=/)
  })

  test('rejeita senha atual incorreta', async ({ page, login }) => {
    await login()
    await page.goto('/perfil')

    await page.getByLabel('Senha atual', { exact: true }).fill('Errada@123')
    await page.getByLabel('Nova senha', { exact: true }).fill('Kurio@999')
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Kurio@999')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByRole('alert').first()).toBeVisible()
  })

  test('mostra skeleton com latência alta e depois o formulário', async ({
    page,
    mocks,
    login,
  }) => {
    await login()
    await mocks.setScenario('slow')
    await page.goto('/perfil')

    await expect(page.locator('[aria-busy="true"]').first()).toBeVisible()
    await expect(page.getByLabel('Nome de exibição')).toBeVisible({ timeout: 15_000 })
  })
})

const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('avatar', () => {
  test('envia, persiste após recarregar e remove o avatar', async ({ page, login }) => {
    await login()
    await page.goto('/perfil')
    const input = page.getByLabel('Escolher imagem de avatar')

    await input.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_PIXEL })
    await expect(page.getByRole('status').filter({ hasText: 'Avatar atualizado' })).toBeAttached()

    await page.reload()
    await expect(page.locator('main img[src^="data:"]').first()).toBeVisible()

    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Avatar removido' })).toBeAttached()
  })

  test('rejeita arquivo que não é imagem', async ({ page, login }) => {
    await login()
    await page.goto('/perfil')

    await page.getByLabel('Escolher imagem de avatar').setInputFiles({
      name: 'nota.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('não sou uma imagem'),
    })

    await expect(page.getByRole('alert').first()).toBeVisible()
  })
})

test.describe('carteiras', () => {
  test('valida o endereço antes de salvar', async ({ page, login }) => {
    await login()
    await page.goto('/perfil/carteiras')
    const address = page.getByLabel(/^Endereço da carteira/).first()

    await address.fill('endereco-invalido')
    await page.getByRole('button', { name: 'Salvar carteira' }).first().click()

    await expect(page.getByRole('alert').first()).toBeVisible()
  })

  test('lista a carteira principal do colecionador', async ({ page, login }) => {
    await login()
    await page.goto('/perfil/carteiras')

    await expect(page.getByRole('heading', { name: /Carteira principal/i })).toBeVisible()
    await expect(page.getByLabel('Endereço da carteira').first()).not.toHaveValue('')
  })

  test('salva a carteira secundária igual à principal', async ({ page, login }) => {
    await login(users.creator)
    await page.goto('/perfil/carteiras')

    await page.getByLabel('Igual à carteira principal').check()
    await page.getByRole('button', { name: 'Salvar carteira' }).last().click()

    await expect(
      page.getByRole('status').filter({ hasText: 'Carteira secundária salva' }),
    ).toBeAttached()
  })

  test('exige a carteira principal antes de uma secundária', async ({ page, mocks }) => {
    await page.goto('/')
    await mocks.reset()
    await page.goto('/?auth=cadastro')
    const dialog = page.getByRole('dialog')
    const stamp = Date.now()
    await dialog.getByPlaceholder('Nome de usuário').fill(`sem${stamp}`)
    await dialog.getByPlaceholder('Digite seu e-mail').fill(`sem${stamp}@kurio.dev`)
    await dialog.getByPlaceholder('Senha', { exact: true }).fill('Kurio@789')
    await dialog.getByPlaceholder('Confirmar senha').fill('Kurio@789')
    await dialog.getByRole('button', { name: 'Criar conta', exact: true }).last().click()
    await expect(dialog).toBeHidden()

    await page.goto('/perfil/carteiras')

    await expect(
      page.getByText('Cadastre a carteira principal para adicionar uma secundária.'),
    ).toBeVisible()
  })
})
