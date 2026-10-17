import { Link, useRouter, useSearch } from '@tanstack/react-router'
import type { RefObject } from 'react'
import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/shared/lib/utils'
import { closeAuthDialog } from '../auth-navigation'
import { authSearchSchema } from '../search'
import { useSession } from '../use-session'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { SocialButtons } from './social-buttons'

const tabClass =
  'rounded-sm px-1 text-lg font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring'

type AuthDialogProps = {
  returnFocusRef: RefObject<HTMLElement | null>
}

export function AuthDialog({ returnFocusRef }: AuthDialogProps) {
  const router = useRouter()
  const search = authSearchSchema.parse(useSearch({ strict: false }))
  const session = useSession()

  const open = search.auth !== undefined && session.status !== 'authenticated'
  const isLogin = search.auth !== 'cadastro'

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          closeAuthDialog(router)
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onCloseAutoFocus={(event) => {
            const target = returnFocusRef.current
            returnFocusRef.current = null
            if (target?.isConnected) {
              event.preventDefault()
              target.focus()
            }
          }}
          className="fixed inset-0 z-50 overflow-y-auto bg-background outline-none md:inset-auto md:top-[160px] md:left-1/2 md:max-h-[calc(100dvh-10rem)] md:w-[500px] md:-translate-x-1/2 md:border-b-[6px] md:border-primary md:bg-card"
        >
          <div className="mx-auto flex min-h-full w-full max-w-[420px] flex-col px-7 pt-[130px] pb-10 md:max-w-none md:px-0 md:pt-8 md:pb-10">
            <p
              aria-hidden="true"
              className="text-center text-3xl font-bold tracking-[0.1em] md:hidden"
            >
              KURIO
            </p>

            <div className="hidden items-center justify-center gap-3 md:flex">
              <Link
                to="."
                search={(previous) => ({ ...previous, auth: 'entrar' as const })}
                replace
                resetScroll={false}
                aria-current={isLogin ? 'page' : undefined}
                className={cn(tabClass, isLogin ? 'text-primary' : 'text-foreground')}
              >
                Entrar
              </Link>
              <span aria-hidden="true" className="h-5 w-px bg-primary" />
              <Link
                to="."
                search={(previous) => ({ ...previous, auth: 'cadastro' as const })}
                replace
                resetScroll={false}
                aria-current={!isLogin ? 'page' : undefined}
                className={cn(tabClass, !isLogin ? 'text-primary' : 'text-foreground')}
              >
                Criar conta
              </Link>
            </div>

            <DialogPrimitive.Title className="mt-[85px] text-center text-xl font-bold md:sr-only">
              {isLogin ? 'Entrar' : 'Criar perfil de colecionador'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only text-center text-xs md:not-sr-only md:mx-auto md:mt-8 md:max-w-[360px]">
              {isLogin
                ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
                : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
            </DialogPrimitive.Description>

            {search.motivo === 'sessao-expirada' ? (
              <p
                role="alert"
                className="mx-auto mt-6 w-full max-w-[340px] rounded-md bg-primary/15 px-3 py-2 text-center text-xs text-warm"
              >
                Sua sessão expirou. Entre novamente para continuar de onde parou.
              </p>
            ) : null}

            <div className="mx-auto mt-8 flex w-full flex-col gap-6 md:max-w-[340px]">
              {isLogin ? (
                <LoginForm key="login" returnTo={search.retorno} />
              ) : (
                <RegisterForm key="register" returnTo={search.retorno} />
              )}
              <SocialButtons />
            </div>

            <p className="mt-auto pt-10 text-center text-sm text-warm md:hidden">
              {isLogin ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
              <Link
                to="."
                search={(previous) => ({
                  ...previous,
                  auth: isLogin ? ('cadastro' as const) : ('entrar' as const),
                })}
                replace
                resetScroll={false}
                className="rounded-sm underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isLogin ? 'Crie uma conta' : 'Entre'}
              </Link>
            </p>
          </div>

          <DialogPrimitive.Close className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-sm text-primary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-5" aria-hidden="true" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
