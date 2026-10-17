import { describe, expect, it } from 'vitest'
import { profileFormSchema } from './schemas'

const base = {
  name: 'Marina Duarte',
  username: 'marina.duarte',
  email: 'm@kurio.dev',
  ensName: { name: 'marina', suffix: '.eth' as const },
  walletNickname: 'Carteira',
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
}

function messages(input: unknown) {
  const result = profileFormSchema.safeParse(input)
  return Object.fromEntries(
    (result.success ? [] : result.error.issues).map((issue) => [
      issue.path.join('.'),
      issue.message,
    ]),
  )
}

describe('profileFormSchema', () => {
  it('accepts the profile without touching the password', () => {
    expect(profileFormSchema.safeParse(base).success).toBe(true)
  })

  it('validates the profile fields', () => {
    const result = messages({
      ...base,
      name: '',
      username: 'a b',
      email: 'x',
      ensName: { name: 'AB', suffix: '.eth' },
      walletNickname: '',
    })
    expect(Object.keys(result)).toEqual(
      expect.arrayContaining(['name', 'username', 'email', 'walletNickname']),
    )
  })

  it('requires the whole password trio once any password field is filled', () => {
    expect(messages({ ...base, newPassword: 'Nova@12345' })).toEqual({
      currentPassword: 'Informe a senha atual',
      confirmNewPassword: 'As senhas não conferem',
    })
  })

  it('checks the new password length and confirmation', () => {
    expect(
      messages({ ...base, currentPassword: 'x', newPassword: '123', confirmNewPassword: '321' }),
    ).toMatchObject({
      newPassword: 'A senha deve ter ao menos 8 caracteres',
      confirmNewPassword: 'As senhas não conferem',
    })
  })

  it('accepts a complete password change', () => {
    expect(
      profileFormSchema.safeParse({
        ...base,
        currentPassword: 'Kurio@123',
        newPassword: 'Nova@12345',
        confirmNewPassword: 'Nova@12345',
      }).success,
    ).toBe(true)
  })

  it('normalizes the ENS name to lowercase', () => {
    const parsed = profileFormSchema.parse({
      ...base,
      ensName: { name: ' Marina ', suffix: '.eth' },
    })
    expect(parsed.ensName.name).toBe('marina')
  })
})
