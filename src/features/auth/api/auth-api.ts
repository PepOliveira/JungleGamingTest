import { authResponseSchema, sessionResponseSchema } from '@/contracts/auth'
import type { LoginRequest, RegisterRequest } from '@/contracts/auth'
import { endpoints } from '@/contracts/endpoints'
import { apiCommand, apiRequest } from '@/shared/api/request'

export function login(body: LoginRequest) {
  return apiRequest({ method: 'POST', url: endpoints.auth.login, data: body }, authResponseSchema)
}

export function register(body: RegisterRequest) {
  return apiRequest(
    { method: 'POST', url: endpoints.auth.register, data: body },
    authResponseSchema,
  )
}

export function fetchSession(signal?: AbortSignal) {
  return apiRequest({ url: endpoints.auth.session, signal }, sessionResponseSchema)
}

export function logout() {
  return apiCommand({ method: 'POST', url: endpoints.auth.logout })
}
