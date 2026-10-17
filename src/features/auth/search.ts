import { z } from 'zod'

export const authSearchSchema = z.object({
  auth: z.enum(['entrar', 'cadastro']).optional().catch(undefined),
  retorno: z.string().max(2000).optional().catch(undefined),
  motivo: z.enum(['sessao-expirada']).optional().catch(undefined),
})
export type AuthSearch = z.output<typeof authSearchSchema>
export type AuthMode = NonNullable<AuthSearch['auth']>

const AUTH_PARAMS = ['auth', 'retorno', 'motivo'] as const

export function stripAuthParams(href: string, origin: string) {
  const url = new URL(href, origin)
  AUTH_PARAMS.forEach((param) => url.searchParams.delete(param))
  return `${url.pathname}${url.search}${url.hash}`
}

export function sanitizeReturnPath(value: string | undefined, origin: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return undefined
  }
  return stripAuthParams(value, origin)
}
