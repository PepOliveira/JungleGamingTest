import axios from 'axios'
import type { ApiErrorBody, ApiErrorCode } from '@/contracts/errors'
import { apiErrorBodySchema } from '@/contracts/errors'

export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'transient'
  | 'network'
  | 'timeout'
  | 'canceled'
  | 'contract'
  | 'unknown'

type ApiErrorInit = {
  kind: ApiErrorKind
  message: string
  status?: number | null
  code?: ApiErrorCode | null
  fieldErrors?: Record<string, string[]>
  details?: Record<string, unknown>
  cause?: unknown
}

const retryableKinds: ReadonlySet<ApiErrorKind> = new Set(['transient', 'network', 'timeout'])

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly code: ApiErrorCode | null
  readonly fieldErrors: Record<string, string[]>
  readonly details: Record<string, unknown>

  constructor({ kind, message, status, code, fieldErrors, details, cause }: ApiErrorInit) {
    super(message, { cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = status ?? null
    this.code = code ?? null
    this.fieldErrors = fieldErrors ?? {}
    this.details = details ?? {}
  }

  get retryable() {
    return retryableKinds.has(this.kind)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 408 || status === 425 || status === 429 || status >= 500) return 'transient'
  if (status >= 400) return 'validation'
  return 'unknown'
}

function kindFromCode(code: ApiErrorCode): ApiErrorKind | null {
  switch (code) {
    case 'validation_error':
    case 'coupon_invalid':
    case 'coupon_expired':
      return 'validation'
    case 'unauthorized':
    case 'invalid_credentials':
    case 'session_expired':
      return 'unauthorized'
    case 'forbidden':
      return 'forbidden'
    case 'not_found':
      return 'not_found'
    case 'email_taken':
    case 'availability_conflict':
    case 'quote_outdated':
    case 'idempotency_conflict':
    case 'primary_wallet_conflict':
      return 'conflict'
    case 'transient_error':
    case 'internal_error':
      return 'transient'
  }
}

function fromBody(status: number, body: ApiErrorBody, cause: unknown) {
  return new ApiError({
    kind: kindFromCode(body.code) ?? kindFromStatus(status),
    message: body.message,
    status,
    code: body.code,
    fieldErrors: body.fieldErrors,
    details: body.details,
    cause,
  })
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error
  }

  if (axios.isCancel(error)) {
    return new ApiError({ kind: 'canceled', message: 'Requisição cancelada', cause: error })
  }

  if (axios.isAxiosError(error)) {
    if (error.response) {
      const { status, data } = error.response
      const parsed = apiErrorBodySchema.safeParse(data)
      if (parsed.success) {
        return fromBody(status, parsed.data, error)
      }
      return new ApiError({
        kind: kindFromStatus(status),
        message: error.message,
        status,
        cause: error,
      })
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({
        kind: 'timeout',
        message: 'A requisição excedeu o tempo limite',
        cause: error,
      })
    }

    return new ApiError({
      kind: 'network',
      message: 'Não foi possível conectar ao servidor',
      cause: error,
    })
  }

  return new ApiError({
    kind: 'unknown',
    message: error instanceof Error ? error.message : 'Erro desconhecido',
    cause: error,
  })
}
