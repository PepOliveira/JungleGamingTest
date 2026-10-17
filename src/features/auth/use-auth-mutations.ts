import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { announce } from '@/shared/lib/announcer'
import { login, logout, register } from './api/auth-api'
import { endSession, startSession } from './session-actions'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: (auth) => {
      startSession(queryClient, auth)
      announce(`Sessão iniciada como ${auth.user.name}`)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: register,
    onSuccess: (auth) => {
      startSession(queryClient, auth)
      announce(`Conta criada. Sessão iniciada como ${auth.user.name}`)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      try {
        await logout()
      } catch {
        return
      }
    },
    onSettled: async () => {
      endSession(queryClient)
      announce('Sessão encerrada')
      await router.invalidate()
    },
  })
}
