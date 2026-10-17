import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { Path } from 'react-hook-form'
import type { User } from '@/contracts/auth'
import { ensSuffixSchema } from '@/contracts/auth'
import { applyApiError } from '@/features/auth/apply-api-error'
import { announce } from '@/shared/lib/announcer'
import { Button } from '@/shared/ui/button'
import { EnsField, PasswordTextField, TextField } from '@/shared/ui/form-fields'
import { profileFormSchema, wantsPasswordChange } from '../schemas'
import type { ProfileFormInput, ProfileFormValues } from '../schemas'
import { useChangePassword, useUpdateProfile } from '../use-profile'
import { AvatarField } from './avatar-field'

const profileFields: readonly Path<ProfileFormInput>[] = [
  'name',
  'username',
  'email',
  'ensName.name',
  'walletNickname',
]
const passwordFields: readonly Path<ProfileFormInput>[] = ['currentPassword', 'newPassword']

function toDefaults(user: User): ProfileFormInput {
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    ensName: user.ensName ?? { name: '', suffix: '.eth' },
    walletNickname: user.walletNickname ?? '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  }
}

type ProfileFormProps = {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toDefaults(user),
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await updateProfile.mutateAsync({
        name: values.name,
        username: values.username,
        email: values.email,
        ensName: values.ensName,
        walletNickname: values.walletNickname,
      })

      if (wantsPasswordChange(values)) {
        try {
          await changePassword.mutateAsync({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          })
        } catch (failure) {
          form.reset({
            ...toDefaults(saved),
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            confirmNewPassword: values.confirmNewPassword,
          })
          applyApiError(form, failure, passwordFields)
          announce('Dados salvos, mas a senha não foi alterada.', { visible: true, tone: 'error' })
          return
        }
      }

      form.reset(toDefaults(saved))
      announce('Perfil atualizado', { visible: true })
    } catch (failure) {
      applyApiError(form, failure, profileFields)
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6 lg:gap-8">
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2 lg:gap-x-7">
        <div className="flex flex-col gap-6">
          <TextField
            label="Nome de exibição"
            required
            autoComplete="name"
            error={errors.name?.message}
            {...form.register('name')}
          />
          <TextField
            label="E-mail"
            type="email"
            required
            autoComplete="email"
            error={errors.email?.message}
            {...form.register('email')}
          />
          <TextField
            label="Apelido da carteira"
            required
            error={errors.walletNickname?.message}
            {...form.register('walletNickname')}
          />
        </div>
        <div className="flex flex-col gap-6">
          <TextField
            label="Nome de usuário"
            required
            autoComplete="username"
            error={errors.username?.message}
            {...form.register('username')}
          />
          <EnsField
            label="Nome ENS"
            required
            suffixes={ensSuffixSchema.options}
            suffixProps={form.register('ensName.suffix')}
            nameProps={form.register('ensName.name')}
            error={errors.ensName?.name?.message ?? errors.ensName?.suffix?.message}
          />
          <AvatarField user={user} />
        </div>
      </div>

      <section
        aria-labelledby="password-title"
        className="flex flex-col gap-6 lg:max-w-[calc(50%-0.875rem)]"
      >
        <h2 id="password-title" className="text-base font-bold">
          Alterar senha
        </h2>
        <PasswordTextField
          label="Senha atual"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...form.register('currentPassword')}
        />
        <PasswordTextField
          label="Nova senha"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...form.register('newPassword')}
        />
        <PasswordTextField
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.confirmNewPassword?.message}
          {...form.register('confirmNewPassword')}
        />
      </section>

      {errors.root?.server ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.server.message}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="h-10 w-fit px-10 font-bold"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  )
}
