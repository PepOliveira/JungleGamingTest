import { describe, expect, it } from 'vitest'
import { loginFormSchema, registerFormSchema } from './schemas'

function messages(result: {
  success: boolean
  error?: { issues: { path: PropertyKey[]; message: string }[] }
}) {
  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [String(issue.path[0]), issue.message]),
  )
}

describe('loginFormSchema', () => {
  it('requires a valid e-mail and a password', () => {
    expect(messages(loginFormSchema.safeParse({ email: 'x', password: '' }))).toEqual({
      email: 'Informe um e-mail válido',
      password: 'Informe sua senha',
    })
  })

  it('accepts valid credentials', () => {
    expect(loginFormSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true)
  })
})

describe('registerFormSchema', () => {
  const valid = {
    name: 'Marina',
    email: 'm@kurio.dev',
    password: 'Kurio@123',
    confirmPassword: 'Kurio@123',
  }

  it('accepts a valid registration', () => {
    expect(registerFormSchema.safeParse(valid).success).toBe(true)
  })

  it('validates every field', () => {
    const result = registerFormSchema.safeParse({
      name: ' a ',
      email: 'no',
      password: '123',
      confirmPassword: '',
    })
    expect(Object.keys(messages(result))).toEqual(
      expect.arrayContaining(['name', 'email', 'password', 'confirmPassword']),
    )
  })

  it('flags mismatching passwords on the confirmation field', () => {
    const result = registerFormSchema.safeParse({ ...valid, confirmPassword: 'Other@1234' })
    expect(messages(result)).toEqual({ confirmPassword: 'As senhas não conferem' })
  })
})
