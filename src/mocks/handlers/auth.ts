import { http, HttpResponse } from 'msw'
import { authResponseSchema, loginRequestSchema, registerRequestSchema } from '@/contracts/auth'
import type { AuthResponse, SessionResponse, User } from '@/contracts/auth'
import { endpoints } from '@/contracts/endpoints'
import { apiUrl } from '../config'
import { getDb, updateDb } from '../db/store'
import type { UserRecord } from '../db/types'
import { authenticate, SESSION_TTL_MS } from '../utils/auth'
import { errorResponse } from '../utils/errors'
import { randomToken } from '../utils/ids'
import { simulateLatency } from '../utils/latency'
import { fieldFailure, validationFailure } from '../utils/validation'
import { hashPassword, verifyPassword } from '../utils/password'

function toUser(record: UserRecord): User {
  return {
    id: record.id,
    username: record.username,
    name: record.name,
    email: record.email,
    ensName: record.ensName,
    walletNickname: record.walletNickname,
    avatarUrl: record.avatarUrl,
    createdAt: record.createdAt,
  }
}

function openSession(userId: string) {
  const token = randomToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  updateDb((db) => {
    db.sessions[token] = { userId, expiresAt }
  })
  return { token, expiresAt }
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export const authHandlers = [
  http.post(apiUrl(endpoints.auth.register), async ({ request }) => {
    await simulateLatency()

    const parsed = registerRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return validationFailure(parsed.error.issues)
    }

    const { username, email, password } = parsed.data
    const normalizedEmail = email.toLowerCase()
    const users = getDb().users
    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      return fieldFailure(409, 'email_taken', 'email', 'Este e-mail já está cadastrado')
    }
    if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      return fieldFailure(409, 'username_taken', 'username', 'Este nome de usuário já está em uso')
    }

    const salt = randomToken(8)
    const record: UserRecord = {
      id: `user_${randomToken(6)}`,
      username,
      name: username,
      email: normalizedEmail,
      ensName: null,
      walletNickname: null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      passwordSalt: salt,
      passwordHash: hashPassword(password, salt),
    }
    updateDb((db) => {
      db.users.push(record)
      db.favorites[record.id] = []
    })

    const { token, expiresAt } = openSession(record.id)
    const body: AuthResponse = authResponseSchema.parse({
      user: toUser(record),
      accessToken: token,
      expiresAt,
    })
    return HttpResponse.json(body, { status: 201 })
  }),

  http.post(apiUrl(endpoints.auth.login), async ({ request }) => {
    await simulateLatency()

    const parsed = loginRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return validationFailure(parsed.error.issues)
    }

    const { email, password } = parsed.data
    const record = getDb().users.find((user) => user.email.toLowerCase() === email.toLowerCase())
    if (!record || !verifyPassword(password, record.passwordSalt, record.passwordHash)) {
      return errorResponse(401, 'invalid_credentials', 'E-mail ou senha incorretos')
    }

    const { token, expiresAt } = openSession(record.id)
    const body: AuthResponse = { user: toUser(record), accessToken: token, expiresAt }
    return HttpResponse.json(body)
  }),

  http.get(apiUrl(endpoints.auth.session), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) {
      return result.error
    }

    const session = getDb().sessions[result.token]
    const body: SessionResponse = {
      user: toUser(result.user),
      expiresAt: session?.expiresAt ?? new Date().toISOString(),
    }
    return HttpResponse.json(body)
  }),

  http.post(apiUrl(endpoints.auth.logout), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) {
      return new HttpResponse(null, { status: 204 })
    }

    updateDb((db) => {
      delete db.sessions[result.token]
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
