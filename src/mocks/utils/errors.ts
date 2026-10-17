import { HttpResponse } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '@/contracts/errors'

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
  details?: Record<string, unknown>,
) {
  const body: ApiErrorBody = {
    code,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(details ? { details } : {}),
  }
  return HttpResponse.json(body, { status })
}
