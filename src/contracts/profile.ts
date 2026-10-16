import { z } from 'zod'
import { passwordSchema, userSchema } from './auth'

export const profileResponseSchema = userSchema
export type ProfileResponse = z.infer<typeof profileResponseSchema>

export const updateProfileRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
})
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>

export const updateAvatarRequestSchema = z.object({
  avatar: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,/, 'Formato de imagem inválido')
    .nullable(),
})
export type UpdateAvatarRequest = z.infer<typeof updateAvatarRequestSchema>

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
})
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
