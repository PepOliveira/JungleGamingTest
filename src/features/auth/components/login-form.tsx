import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { UnavailableLink } from '@/shared/layout/unavailable-link'
import { Button } from '@/shared/ui/button'
import { applyApiError } from '../apply-api-error'
import { finishAuth } from '../auth-navigation'
import { loginFormSchema } from '../schemas'
import type { LoginFormValues } from '../schemas'
import { useLogin } from '../use-auth-mutations'
import { AuthField, PasswordField } from './auth-field'

type LoginFormProps = {
  returnTo: string | undefined
}

export function LoginForm({ returnTo }: LoginFormProps) {
  const router = useRouter()
  const login = useLogin()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      finishAuth(router, returnTo)
    } catch (error) {
      applyApiError(form, error, ['email', 'password'])
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
      <AuthField
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        autoFocus
        error={errors.email?.message}
        {...form.register('email')}
      />
      <PasswordField
        label="Senha"
        autoComplete="current-password"
        placeholder="Senha"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <div className="flex justify-end">
        <UnavailableLink
          secao="recuperar-senha"
          className="rounded-sm text-xs text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring max-md:text-base"
        >
          Esqueceu a senha?
        </UnavailableLink>
      </div>
      {errors.root?.server ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errors.root.server.message}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-12 w-full rounded-xl text-base font-bold max-md:mt-6 max-md:h-[60px] md:h-11 md:rounded-sm"
      >
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
