import { expect, test, users } from './support/test'

test.describe('autenticação', () => {
  test('entra com credenciais válidas e mantém a sessão após recarregar', async ({
    page,
    login,
    isMobile,
  }) => {
    await login()

    if (!isMobile) {
      await expect(page.getByRole('button', { name: /Abrir menu da conta/ })).toContainText(
        users.collector.name,
      )
    }
    await page.reload()
    await expect(page).not.toHaveURL(/auth=/)
    if (!isMobile) {
      await expect(page.getByRole('button', { name: /Abrir menu da conta/ })).toBeVisible()
    }
  })

  test('mostra erro com credenciais inválidas e não fecha o diálogo', async ({ page }) => {
    await page.goto('/?auth=entrar')
    const dialog = page.getByRole('dialog')

    await dialog.getByPlaceholder('contato@email.com').fill(users.collector.email)
    await dialog.getByPlaceholder('Senha').fill('SenhaErrada@1')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(dialog.getByRole('alert').first()).toBeVisible()
    await expect(dialog).toBeVisible()
  })

  test('valida campos obrigatórios antes de enviar', async ({ page }) => {
    await page.goto('/?auth=entrar')
    const dialog = page.getByRole('dialog')

    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(dialog.getByRole('alert').first()).toBeVisible()
  })

  test('cria uma conta nova e já entra logado', async ({ page }) => {
    await page.goto('/?auth=cadastro')
    const dialog = page.getByRole('dialog')
    const stamp = Date.now()

    await dialog.getByPlaceholder('Nome de usuário').fill(`novo${stamp}`)
    await dialog.getByPlaceholder('Digite seu e-mail').fill(`novo${stamp}@kurio.dev`)
    await dialog.getByPlaceholder('Senha', { exact: true }).fill('Kurio@789')
    await dialog.getByPlaceholder('Confirmar senha').fill('Kurio@789')
    await dialog.getByRole('button', { name: 'Criar conta', exact: true }).last().click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('status').filter({ hasText: 'Conta criada' })).toBeAttached()
  })

  test('rejeita e-mail já cadastrado', async ({ page }) => {
    await page.goto('/?auth=cadastro')
    const dialog = page.getByRole('dialog')

    await dialog.getByPlaceholder('Nome de usuário').fill('outrousuario')
    await dialog.getByPlaceholder('Digite seu e-mail').fill(users.collector.email)
    await dialog.getByPlaceholder('Senha', { exact: true }).fill('Kurio@789')
    await dialog.getByPlaceholder('Confirmar senha').fill('Kurio@789')
    await dialog.getByRole('button', { name: 'Criar conta', exact: true }).last().click()

    await expect(dialog.getByRole('alert').first()).toBeVisible()
    await expect(dialog).toBeVisible()
  })

  test('rota protegida redireciona visitante para o login e volta ao destino', async ({ page }) => {
    await page.goto('/perfil')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(/auth=entrar/)

    await dialog.getByPlaceholder('contato@email.com').fill(users.collector.email)
    await dialog.getByPlaceholder('Senha').fill(users.collector.password)
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/perfil$/)
  })

  test('sair encerra a sessão e limpa os dados privados', async ({ page, login, isMobile }) => {
    test.skip(isMobile === true, 'Menu da conta fica no cabeçalho desktop')
    await login()

    await page.getByRole('button', { name: /Abrir menu da conta/ }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()

    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    const stored = await page.evaluate(() => localStorage.getItem('kurio:session'))
    expect(stored).toBeNull()
  })
})
