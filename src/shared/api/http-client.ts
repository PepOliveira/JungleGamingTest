import axios from 'axios'
import { env } from '@/shared/config/env'
import { whenRuntimeReady } from '@/shared/config/runtime-ready'
import type { ApiError } from './api-error'
import { toApiError } from './api-error'
import { serializeParams } from './serialize-params'

type HttpClientHooks = {
  getAccessToken: () => string | null
  onUnauthorized: ((error: ApiError) => void) | null
}

const hooks: HttpClientHooks = {
  getAccessToken: () => null,
  onUnauthorized: null,
}

export function configureHttpClient(next: Partial<HttpClientHooks>) {
  Object.assign(hooks, next)
}

export const httpClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
  paramsSerializer: { serialize: (params) => serializeParams(params) },
})

httpClient.interceptors.request.use(async (config) => {
  await whenRuntimeReady()
  const token = hooks.getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const hadSession =
      axios.isAxiosError(error) && Boolean(error.config?.headers?.has('Authorization'))
    if (apiError.kind === 'unauthorized' && hadSession) {
      hooks.onUnauthorized?.(apiError)
    }
    return Promise.reject(apiError)
  },
)
