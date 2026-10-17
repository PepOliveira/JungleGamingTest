import { delay, http, HttpResponse } from 'msw'
import { apiUrl } from '../config'
import { matchFault } from '../faults'
import { errorResponse } from '../utils/errors'

export const faultHandlers = [
  http.all(apiUrl('/*'), async ({ request }) => {
    const fault = matchFault(request.method, new URL(request.url).pathname)
    if (!fault) return undefined

    if (fault.effect === 'network') {
      return HttpResponse.error()
    }
    if (fault.effect === 'delay') {
      await delay(fault.delayMs ?? 1500)
      return undefined
    }
    if (fault.effect === 'timeout') {
      await delay('infinite')
      return undefined
    }

    const status = fault.status ?? 500
    return errorResponse(
      status,
      fault.code ?? (status >= 500 ? 'internal_error' : 'validation_error'),
      fault.message ?? 'Falha simulada pelo cenário de teste',
    )
  }),
]
