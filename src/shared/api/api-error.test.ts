import { AxiosError, CanceledError } from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, toApiError } from './api-error'

const config = { headers: {} } as InternalAxiosRequestConfig

function httpError(status: number, data: unknown) {
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, response)
}

describe('toApiError', () => {
  it('maps validation errors with field errors', () => {
    const error = toApiError(
      httpError(422, {
        code: 'validation_error',
        message: 'Dados inválidos',
        fieldErrors: { email: ['E-mail inválido'] },
      }),
    )
    expect(error.kind).toBe('validation')
    expect(error.status).toBe(422)
    expect(error.fieldErrors.email).toEqual(['E-mail inválido'])
    expect(error.retryable).toBe(false)
  })

  it('maps coupon and availability codes', () => {
    expect(toApiError(httpError(422, { code: 'coupon_expired', message: 'x' })).kind).toBe(
      'validation',
    )
    expect(toApiError(httpError(409, { code: 'availability_conflict', message: 'x' })).kind).toBe(
      'conflict',
    )
  })

  it('keeps the session expired code under the unauthorized kind', () => {
    const error = toApiError(
      httpError(401, { code: 'session_expired', message: 'Sessão expirada' }),
    )
    expect(error.kind).toBe('unauthorized')
    expect(error.code).toBe('session_expired')
  })

  it('falls back to the status when the body is not a contract error', () => {
    expect(toApiError(httpError(404, '<html>')).kind).toBe('not_found')
    expect(toApiError(httpError(403, null)).kind).toBe('forbidden')
  })

  it('treats 5xx and 429 as retryable transient errors', () => {
    expect(toApiError(httpError(503, null)).retryable).toBe(true)
    expect(toApiError(httpError(429, null)).retryable).toBe(true)
    expect(toApiError(httpError(500, null)).kind).toBe('transient')
  })

  it('detects timeouts and connection failures', () => {
    const timeout = new AxiosError('timeout', 'ECONNABORTED', config)
    const offline = new AxiosError('Network Error', 'ERR_NETWORK', config)
    expect(toApiError(timeout)).toMatchObject({ kind: 'timeout', retryable: true })
    expect(toApiError(offline)).toMatchObject({ kind: 'network', retryable: true })
  })

  it('detects canceled requests', () => {
    expect(toApiError(new CanceledError()).kind).toBe('canceled')
  })

  it('returns existing api errors untouched', () => {
    const original = new ApiError({ kind: 'contract', message: 'x' })
    expect(toApiError(original)).toBe(original)
  })
})
