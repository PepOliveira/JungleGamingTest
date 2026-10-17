import { getDb, updateDb } from '../db/store'
import type { UserRecord } from '../db/types'
import { errorResponse } from './errors'

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000

type Authenticated = { user: UserRecord; token: string; error?: undefined }
type Rejected = { error: Response; user?: undefined; token?: undefined }

function readBearer(request: Request) {
  const header = request.headers.get('Authorization')
  const match = header ? /^Bearer\s+(.+)$/i.exec(header) : null
  return match?.[1] ?? null
}

export function authenticate(request: Request): Authenticated | Rejected {
  const token = readBearer(request)
  if (!token) {
    return { error: errorResponse(401, 'unauthorized', 'Faça login para continuar') }
  }

  const db = getDb()
  const session = db.sessions[token]
  if (!session) {
    return { error: errorResponse(401, 'unauthorized', 'Sessão inválida') }
  }

  if (Date.parse(session.expiresAt) <= Date.now()) {
    updateDb((state) => {
      delete state.sessions[token]
    })
    return { error: errorResponse(401, 'session_expired', 'Sua sessão expirou') }
  }

  const user = db.users.find((candidate) => candidate.id === session.userId)
  if (!user) {
    return { error: errorResponse(401, 'unauthorized', 'Sessão inválida') }
  }

  return { user, token }
}
