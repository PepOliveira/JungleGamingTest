import type { AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { IDEMPOTENCY_HEADER } from '@/contracts/endpoints'
import { ApiError } from './api-error'
import { httpClient } from './http-client'

export async function apiRequest<TSchema extends z.ZodType>(
  config: AxiosRequestConfig,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const response = await httpClient.request<unknown>(config)
  const parsed = schema.safeParse(response.data)

  if (!parsed.success) {
    throw new ApiError({
      kind: 'contract',
      message: 'A resposta da API não corresponde ao contrato esperado',
      status: response.status,
      details: { issues: parsed.error.issues },
      cause: parsed.error,
    })
  }

  return parsed.data
}

export async function apiCommand(config: AxiosRequestConfig): Promise<void> {
  await httpClient.request(config)
}

export function withIdempotencyKey(config: AxiosRequestConfig, key: string): AxiosRequestConfig {
  return {
    ...config,
    headers: { ...config.headers, [IDEMPOTENCY_HEADER]: key },
  }
}
