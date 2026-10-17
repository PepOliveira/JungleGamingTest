import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { toApiError } from '@/shared/api/api-error'

export function applyApiError<TValues extends FieldValues, TOutput = TValues>(
  form: UseFormReturn<TValues, unknown, TOutput>,
  error: unknown,
  fields: readonly Path<TValues>[],
) {
  const apiError = toApiError(error)
  let applied = false

  for (const field of fields) {
    const message = apiError.fieldErrors[field]?.[0]
    if (message) {
      form.setError(field, { type: 'server', message })
      applied = true
    }
  }

  if (!applied) {
    form.setError('root.server', { type: 'server', message: apiError.message })
  }
}
