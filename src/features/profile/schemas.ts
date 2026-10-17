import { z } from 'zod'
import { updateProfileRequestSchema } from '@/contracts/profile'
import { passwordSchema } from '@/contracts/auth'

export const profileFormSchema = updateProfileRequestSchema
  .extend({
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmNewPassword: z.string(),
  })
  .superRefine((values, context) => {
    const wantsPasswordChange =
      values.currentPassword !== '' || values.newPassword !== '' || values.confirmNewPassword !== ''
    if (!wantsPasswordChange) {
      return
    }

    if (values.currentPassword === '') {
      context.addIssue({
        code: 'custom',
        path: ['currentPassword'],
        message: 'Informe a senha atual',
      })
    }

    const strength = passwordSchema.safeParse(values.newPassword)
    if (!strength.success) {
      context.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: strength.error.issues[0]?.message ?? 'Senha inválida',
      })
    }

    if (values.confirmNewPassword !== values.newPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmNewPassword'],
        message: 'As senhas não conferem',
      })
    }
  })

export type ProfileFormInput = z.input<typeof profileFormSchema>
export type ProfileFormValues = z.output<typeof profileFormSchema>

export function wantsPasswordChange(values: ProfileFormValues) {
  return (
    values.currentPassword !== '' || values.newPassword !== '' || values.confirmNewPassword !== ''
  )
}
