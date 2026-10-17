import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { authResponseSchema, sessionResponseSchema } from '@/contracts/auth'
import { endpoints } from '@/contracts/endpoints'
import { isApiError } from '@/shared/api/api-error'
import type { ApiError } from '@/shared/api/api-error'
import { apiCommand, apiRequest } from '@/shared/api/request'
import { getDb, resetDb, updateDb } from '../db/store'
import { demoCredentials } from '../fixtures/users'
import { setScenario } from '../scenarios'
import { server } from '../server'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  setScenario('instant')
  resetDb()
})

const [demo] = demoCredentials

function post(url: string, data: unknown) {
  return apiRequest({ method: 'POST', url, data }, authResponseSchema)
}

async function failure(promise: Promise<unknown>) {
  const error = await promise.catch((reason: unknown) => reason)
  if (!isApiError(error)) {
    throw new Error('Expected an ApiError')
  }
  return error as ApiError
}

function sessionWith(token: string) {
  return apiRequest(
    { url: endpoints.auth.session, headers: { Authorization: `Bearer ${token}` } },
    sessionResponseSchema,
  )
}

describe('POST /auth/login', () => {
  it('returns the user and a session token for valid credentials', async () => {
    const auth = await post(endpoints.auth.login, demo)
    expect(auth.user.email).toBe(demo.email)
    expect(auth.accessToken.length).toBeGreaterThan(20)
    expect(Date.parse(auth.expiresAt)).toBeGreaterThan(Date.now())
  })

  it('is case insensitive on the e-mail', async () => {
    const auth = await post(endpoints.auth.login, {
      email: demo.email.toUpperCase(),
      password: demo.password,
    })
    expect(auth.user.email).toBe(demo.email)
  })

  it('rejects wrong credentials without telling which field failed', async () => {
    const error = await failure(
      post(endpoints.auth.login, { email: demo.email, password: 'wrong' }),
    )
    expect(error.status).toBe(401)
    expect(error.code).toBe('invalid_credentials')
    expect(error.fieldErrors).toEqual({})
  })

  it('rejects unknown users the same way', async () => {
    const error = await failure(
      post(endpoints.auth.login, { email: 'nobody@kurio.dev', password: 'x' }),
    )
    expect(error.code).toBe('invalid_credentials')
  })

  it('validates the body', async () => {
    const error = await failure(post(endpoints.auth.login, { email: 'not-an-email' }))
    expect(error.status).toBe(422)
    expect(Object.keys(error.fieldErrors)).toEqual(expect.arrayContaining(['email', 'password']))
  })
})

describe('POST /auth/register', () => {
  const body = { name: 'Nova Pessoa', email: 'nova@kurio.dev', password: 'Kurio@789' }

  it('creates the account and opens a session', async () => {
    const auth = await post(endpoints.auth.register, body)
    expect(auth.user).toMatchObject({ name: 'Nova Pessoa', email: 'nova@kurio.dev' })
    expect((await sessionWith(auth.accessToken)).user.id).toBe(auth.user.id)
  })

  it('allows logging in with the new credentials', async () => {
    await post(endpoints.auth.register, body)
    const auth = await post(endpoints.auth.login, { email: body.email, password: body.password })
    expect(auth.user.email).toBe(body.email)
  })

  it('never stores the password in clear text', async () => {
    await post(endpoints.auth.register, body)
    const record = getDb().users.find((user) => user.email === body.email)
    expect(record?.passwordHash).toBeDefined()
    expect(JSON.stringify(record)).not.toContain(body.password)
  })

  it('reports an e-mail conflict as a field error', async () => {
    const error = await failure(post(endpoints.auth.register, { ...body, email: demo.email }))
    expect(error.status).toBe(409)
    expect(error.code).toBe('email_taken')
    expect(error.fieldErrors.email).toEqual(['Este e-mail já está cadastrado'])
  })

  it('treats e-mail conflicts case insensitively', async () => {
    const error = await failure(
      post(endpoints.auth.register, { ...body, email: demo.email.toUpperCase() }),
    )
    expect(error.code).toBe('email_taken')
  })

  it('validates name, e-mail and password', async () => {
    const error = await failure(
      post(endpoints.auth.register, { name: 'A', email: 'x', password: '1' }),
    )
    expect(error.status).toBe(422)
    expect(Object.keys(error.fieldErrors)).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    )
  })
})

describe('GET /auth/session', () => {
  it('requires a token', async () => {
    const error = await failure(apiRequest({ url: endpoints.auth.session }, sessionResponseSchema))
    expect(error.status).toBe(401)
    expect(error.code).toBe('unauthorized')
  })

  it('rejects unknown tokens', async () => {
    expect((await failure(sessionWith('nope'))).code).toBe('unauthorized')
  })

  it('returns the current user for a valid token', async () => {
    const auth = await post(endpoints.auth.login, demo)
    const session = await sessionWith(auth.accessToken)
    expect(session.user.id).toBe(auth.user.id)
    expect(session.expiresAt).toBe(auth.expiresAt)
  })

  it('reports expired sessions and removes them', async () => {
    const auth = await post(endpoints.auth.login, demo)
    updateDb((db) => {
      const session = db.sessions[auth.accessToken]
      if (session) session.expiresAt = new Date(Date.now() - 1000).toISOString()
    })
    const error = await failure(sessionWith(auth.accessToken))
    expect(error.status).toBe(401)
    expect(error.code).toBe('session_expired')
    expect(getDb().sessions[auth.accessToken]).toBeUndefined()
  })

  it('keeps sessions of different users separate', async () => {
    const [first, second] = demoCredentials
    const a = await post(endpoints.auth.login, first)
    const b = await post(endpoints.auth.login, second)
    expect((await sessionWith(a.accessToken)).user.email).toBe(first.email)
    expect((await sessionWith(b.accessToken)).user.email).toBe(second.email)
  })
})

describe('POST /auth/logout', () => {
  it('invalidates the session', async () => {
    const auth = await post(endpoints.auth.login, demo)
    await apiCommand({
      method: 'POST',
      url: endpoints.auth.logout,
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
    expect((await failure(sessionWith(auth.accessToken))).code).toBe('unauthorized')
  })

  it('is idempotent for anonymous calls', async () => {
    await expect(
      apiCommand({ method: 'POST', url: endpoints.auth.logout }),
    ).resolves.toBeUndefined()
  })
})
