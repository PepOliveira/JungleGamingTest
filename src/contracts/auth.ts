import { z } from 'zod'
import { idSchema, isoDateSchema } from './common'

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'O nome de usuário deve ter ao menos 3 caracteres')
  .max(30, 'O nome de usuário deve ter até 30 caracteres')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Use apenas letras, números, ponto, hífen ou sublinhado')

export const ensSuffixSchema = z.enum(['.eth', '.xyz', '.art'])
export type EnsSuffix = z.infer<typeof ensSuffixSchema>

export const ensNameSchema = z.object({
  name: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,63}$/, 'Use de 3 a 63 letras minúsculas, números ou hífen'),
  suffix: ensSuffixSchema,
})
export type EnsName = z.infer<typeof ensNameSchema>

export const userSchema = z.object({
  id: idSchema,
  username: z.string(),
  name: z.string(),
  email: z.email(),
  ensName: ensNameSchema.nullable(),
  walletNickname: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: isoDateSchema,
})
export type User = z.infer<typeof userSchema>

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres')
  .max(72, 'A senha deve ter até 72 caracteres')

export const registerRequestSchema = z.object({
  username: usernameSchema,
  email: z.email('Informe um e-mail válido'),
  password: passwordSchema,
})
export type RegisterRequest = z.infer<typeof registerRequestSchema>

export const loginRequestSchema = z.object({
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
})
export type LoginRequest = z.infer<typeof loginRequestSchema>

export const authResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string().min(1),
  expiresAt: isoDateSchema,
})
export type AuthResponse = z.infer<typeof authResponseSchema>

export const sessionResponseSchema = z.object({
  user: userSchema,
  expiresAt: isoDateSchema,
})
export type SessionResponse = z.infer<typeof sessionResponseSchema>
