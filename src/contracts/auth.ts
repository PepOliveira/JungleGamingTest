import { z } from 'zod'
import { idSchema, isoDateSchema } from './common'

export const userSchema = z.object({
  id: idSchema,
  name: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
  createdAt: isoDateSchema,
})
export type User = z.infer<typeof userSchema>

export const passwordSchema = z.string().min(8).max(72)

export const registerRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  password: passwordSchema,
})
export type RegisterRequest = z.infer<typeof registerRequestSchema>

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
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
