import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { authResponseSchema, userSchema } from '@/contracts/auth'
import { endpoints } from '@/contracts/endpoints'
import { isApiError } from '@/shared/api/api-error'
import type { ApiError } from '@/shared/api/api-error'
import { apiCommand, apiRequest } from '@/shared/api/request'
import { resetDb } from '../db/store'
import { demoCredentials } from '../fixtures/users'
import { setScenario } from '../scenarios'
import { server } from '../server'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  setScenario('instant')
  resetDb()
})

type Headers = Record<string, string>

async function login(index: number, password?: string): Promise<Headers> {
  const credentials = demoCredentials[index]
  const auth = await apiRequest(
    {
      method: 'POST',
      url: endpoints.auth.login,
      data: { email: credentials?.email, password: password ?? credentials?.password },
    },
    authResponseSchema,
  )
  return { Authorization: `Bearer ${auth.accessToken}` }
}

const getProfile = (headers?: Headers) =>
  apiRequest({ url: endpoints.profile.root, headers }, userSchema)
const putProfile = (headers: Headers, data: unknown) =>
  apiRequest({ method: 'PUT', url: endpoints.profile.root, headers, data }, userSchema)
const putAvatar = (headers: Headers, avatar: string | null) =>
  apiRequest(
    { method: 'PUT', url: endpoints.profile.avatar, headers, data: { avatar } },
    userSchema,
  )
const changePassword = (headers: Headers, data: unknown) =>
  apiCommand({ method: 'POST', url: endpoints.profile.password, headers, data })

async function failure(promise: Promise<unknown>) {
  const error = await promise.catch((reason: unknown) => reason)
  if (!isApiError(error)) throw new Error('Expected an ApiError')
  return error as ApiError
}

const validProfile = {
  name: 'Marina D.',
  username: 'marina.d',
  email: 'marina.novo@kurio.dev',
  ensName: { name: 'marina-d', suffix: '.eth' },
  walletNickname: 'Principal',
}

describe('GET /profile', () => {
  it('requires a session', async () => {
    expect((await failure(getProfile())).status).toBe(401)
  })

  it('returns the profile fields shown in the design', async () => {
    const profile = await getProfile(await login(0))
    expect(profile).toMatchObject({
      username: 'marina.duarte',
      name: 'Marina Duarte',
      ensName: { name: 'marina', suffix: '.eth' },
    })
  })
})

describe('PUT /profile', () => {
  it('updates the data and keeps it after a new read', async () => {
    const headers = await login(0)
    await putProfile(headers, validProfile)
    expect(await getProfile(headers)).toMatchObject({
      name: 'Marina D.',
      username: 'marina.d',
      email: 'marina.novo@kurio.dev',
      walletNickname: 'Principal',
    })
  })

  it('validates every field with nested paths', async () => {
    const error = await failure(
      putProfile(await login(0), {
        name: 'M',
        username: 'a b',
        email: 'x',
        ensName: { name: 'AB', suffix: '.eth' },
        walletNickname: '',
      }),
    )
    expect(error.status).toBe(422)
    expect(Object.keys(error.fieldErrors)).toEqual(
      expect.arrayContaining(['name', 'username', 'email', 'walletNickname']),
    )
  })

  it('reports e-mail and username conflicts with other users', async () => {
    const headers = await login(0)
    const email = await failure(
      putProfile(headers, { ...validProfile, email: demoCredentials[1].email }),
    )
    expect(email.code).toBe('email_taken')
    expect(email.fieldErrors.email).toBeDefined()
    const username = await failure(
      putProfile(headers, { ...validProfile, username: 'Rafael.Lima' }),
    )
    expect(username.code).toBe('username_taken')
    expect(username.fieldErrors.username).toBeDefined()
  })

  it('allows keeping the user own e-mail and username', async () => {
    const headers = await login(0)
    const profile = await putProfile(headers, {
      ...validProfile,
      email: demoCredentials[0].email,
      username: 'marina.duarte',
    })
    expect(profile.email).toBe(demoCredentials[0].email)
  })
})

describe('PUT /profile/avatar', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo='

  it('stores and removes the avatar', async () => {
    const headers = await login(0)
    expect((await putAvatar(headers, png)).avatarUrl).toBe(png)
    expect((await getProfile(headers)).avatarUrl).toBe(png)
    expect((await putAvatar(headers, null)).avatarUrl).toBeNull()
  })

  it('rejects unsupported formats', async () => {
    const error = await failure(putAvatar(await login(0), 'data:text/html;base64,AAAA'))
    expect(error.status).toBe(422)
    expect(error.fieldErrors.avatar).toBeDefined()
  })
})

describe('POST /profile/password', () => {
  it('changes the password and invalidates the old one for new logins', async () => {
    const headers = await login(0)
    await changePassword(headers, { currentPassword: 'Kurio@123', newPassword: 'Nova@12345' })
    expect((await failure(login(0))).code).toBe('invalid_credentials')
    expect(await login(0, 'Nova@12345')).toBeDefined()
  })

  it('rejects a wrong current password on its field', async () => {
    const error = await failure(
      changePassword(await login(0), { currentPassword: 'errada', newPassword: 'Nova@12345' }),
    )
    expect(error.status).toBe(422)
    expect(error.fieldErrors.currentPassword).toEqual(['Senha atual incorreta'])
  })

  it('rejects reusing the current password and short passwords', async () => {
    const headers = await login(0)
    const same = await failure(
      changePassword(headers, { currentPassword: 'Kurio@123', newPassword: 'Kurio@123' }),
    )
    expect(same.fieldErrors.newPassword).toBeDefined()
    const short = await failure(
      changePassword(headers, { currentPassword: 'Kurio@123', newPassword: '123' }),
    )
    expect(short.fieldErrors.newPassword).toBeDefined()
  })

  it('never stores the new password in clear text', async () => {
    const { getDb } = await import('../db/store')
    await changePassword(await login(0), {
      currentPassword: 'Kurio@123',
      newPassword: 'Nova@12345',
    })
    expect(JSON.stringify(getDb().users)).not.toContain('Nova@12345')
  })
})
