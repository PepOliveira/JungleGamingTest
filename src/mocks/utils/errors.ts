import { HttpResponse } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '@/contracts/errors'

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  const body: ApiErrorBody = fieldErrors ? { code, message, fieldErrors } : { code, message }
  return HttpResponse.json(body, { status })
}
