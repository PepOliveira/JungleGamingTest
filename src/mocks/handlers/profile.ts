import { http, HttpResponse } from 'msw'
import type { User } from '@/contracts/auth'
import { endpoints } from '@/contracts/endpoints'
import {
  changePasswordRequestSchema,
  updateAvatarRequestSchema,
  updateProfileRequestSchema,
} from '@/contracts/profile'
import { apiUrl } from '../config'
import { getDb, updateDb } from '../db/store'
import type { UserRecord } from '../db/types'
import { authenticate } from '../utils/auth'
import { randomToken } from '../utils/ids'
import { simulateLatency } from '../utils/latency'
import { hashPassword, verifyPassword } from '../utils/password'
import { fieldFailure, validationFailure } from '../utils/validation'

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

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function currentUser(id: string) {
  const user = getDb().users.find((candidate) => candidate.id === id)
  if (!user) {
    throw new Error('Authenticated user missing from the database')
  }
  return user
}

export const profileHandlers = [
  http.get(apiUrl(endpoints.profile.root), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error
    return HttpResponse.json(toUser(currentUser(result.user.id)))
  }),

  http.put(apiUrl(endpoints.profile.root), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    const parsed = updateProfileRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return validationFailure(parsed.error.issues)
    }

    const { name, username, email, ensName, walletNickname } = parsed.data
    const others = getDb().users.filter((user) => user.id !== result.user.id)

    if (others.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      return fieldFailure(409, 'email_taken', 'email', 'Este e-mail já está cadastrado')
    }
    if (others.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      return fieldFailure(409, 'username_taken', 'username', 'Este nome de usuário já está em uso')
    }

    updateDb((db) => {
      const record = db.users.find((user) => user.id === result.user.id)
      if (record) {
        Object.assign(record, {
          name,
          username,
          email: email.toLowerCase(),
          ensName,
          walletNickname,
        })
      }
    })

    return HttpResponse.json(toUser(currentUser(result.user.id)))
  }),

  http.put(apiUrl(endpoints.profile.avatar), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    const parsed = updateAvatarRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return validationFailure(parsed.error.issues)
    }

    updateDb((db) => {
      const record = db.users.find((user) => user.id === result.user.id)
      if (record) {
        record.avatarUrl = parsed.data.avatar
      }
    })

    return HttpResponse.json(toUser(currentUser(result.user.id)))
  }),

  http.post(apiUrl(endpoints.profile.password), async ({ request }) => {
    await simulateLatency()

    const result = authenticate(request)
    if (result.error) return result.error

    const parsed = changePasswordRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return validationFailure(parsed.error.issues)
    }

    const { currentPassword, newPassword } = parsed.data
    const record = currentUser(result.user.id)

    if (!verifyPassword(currentPassword, record.passwordSalt, record.passwordHash)) {
      return fieldFailure(422, 'validation_error', 'currentPassword', 'Senha atual incorreta')
    }
    if (currentPassword === newPassword) {
      return fieldFailure(
        422,
        'validation_error',
        'newPassword',
        'A nova senha deve ser diferente da atual',
      )
    }

    const salt = randomToken(8)
    updateDb((db) => {
      const target = db.users.find((user) => user.id === record.id)
      if (target) {
        target.passwordSalt = salt
        target.passwordHash = hashPassword(newPassword, salt)
      }
    })

    return new HttpResponse(null, { status: 204 })
  }),
]
