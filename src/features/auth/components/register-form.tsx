import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { Button } from '@/shared/ui/button'
import { applyApiError } from '../apply-api-error'
import { finishAuth } from '../auth-navigation'
import { registerFormSchema } from '../schemas'
import type { RegisterFormValues } from '../schemas'
import { useRegister } from '../use-auth-mutations'
import { AuthField, PasswordField } from './auth-field'

type RegisterFormProps = {
  returnTo: string | undefined
}

export function RegisterForm({ returnTo }: RegisterFormProps) {
  const router = useRouter()
  const registerAccount = useRegister()
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ name, email, password }) => {
    try {
      await registerAccount.mutateAsync({ name, email, password })
      finishAuth(router, returnTo)
    } catch (error) {
      applyApiError(form, error, ['name', 'email', 'password'])
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
      <AuthField
        label="Nome de usuário"
        autoComplete="username"
        placeholder="Nome de usuário"
        autoFocus
        error={errors.name?.message}
        {...form.register('name')}
      />
      <AuthField
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <PasswordField
        label="Senha"
        autoComplete="new-password"
        placeholder="Senha"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <PasswordField
        label="Confirmar senha"
        autoComplete="new-password"
        placeholder="Confirmar senha"
        error={errors.confirmPassword?.message}
        {...form.register('confirmPassword')}
      />
      {errors.root?.server ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errors.root.server.message}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 h-12 w-full rounded-xl text-base font-bold md:h-11 md:rounded-sm"
      >
        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  )
}
