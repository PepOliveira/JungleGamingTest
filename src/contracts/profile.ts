import { z } from 'zod'
import { ensNameSchema, passwordSchema, userSchema, usernameSchema } from './auth'

export const profileResponseSchema = userSchema
export type ProfileResponse = z.infer<typeof profileResponseSchema>

export const updateProfileRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome de exibição deve ter ao menos 2 caracteres')
    .max(80, 'O nome de exibição deve ter até 80 caracteres'),
  username: usernameSchema,
  email: z.email('Informe um e-mail válido'),
  ensName: ensNameSchema,
  walletNickname: z
    .string()
    .trim()
    .min(2, 'O apelido deve ter ao menos 2 caracteres')
    .max(40, 'O apelido deve ter até 40 caracteres'),
})
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>

export const AVATAR_MAX_DATA_URL_LENGTH = 400_000

export const updateAvatarRequestSchema = z.object({
  avatar: z
    .string()
    .max(AVATAR_MAX_DATA_URL_LENGTH, 'A imagem é grande demais')
    .regex(/^data:image\/(png|jpeg|webp);base64,/, 'Formato de imagem inválido')
    .nullable(),
})
export type UpdateAvatarRequest = z.infer<typeof updateAvatarRequestSchema>

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: passwordSchema,
})
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
