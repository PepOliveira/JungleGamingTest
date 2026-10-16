import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_SOCKET_URL: z.string().default(''),
  VITE_ENABLE_MOCKS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  VITE_MOCK_SCENARIO: z.string().default('default'),
  VITE_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
})

export const env = envSchema.parse(import.meta.env)
