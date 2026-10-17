import { z } from 'zod'

export const apiErrorCodeSchema = z.enum([
  'validation_error',
  'unauthorized',
  'invalid_credentials',
  'session_expired',
  'forbidden',
  'not_found',
  'email_taken',
  'availability_conflict',
  'quote_outdated',
  'idempotency_conflict',
  'coupon_invalid',
  'coupon_expired',
  'wallet_conflict',
  'wallet_connection_refused',
  'username_taken',
  'transient_error',
  'internal_error',
])
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>

export const apiErrorBodySchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
})
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>
