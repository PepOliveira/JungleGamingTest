import type { ApiErrorCode } from '@/contracts/errors'
import { errorResponse } from './errors'

type Issue = { path: readonly PropertyKey[]; message: string }

export function toFieldErrors(issues: readonly Issue[]) {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of issues) {
    const field = issue.path.length > 0 ? issue.path.map(String).join('.') : 'body'
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message]
  }
  return fieldErrors
}

export function validationFailure(issues: readonly Issue[]) {
  return errorResponse(
    422,
    'validation_error',
    'Verifique os campos informados',
    toFieldErrors(issues),
  )
}

export function fieldFailure(status: number, code: ApiErrorCode, field: string, message: string) {
  return errorResponse(status, code, message, { [field]: [message] })
}
