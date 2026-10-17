import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateWalletRequest } from '@/contracts/wallet'
import { useSession } from '@/features/auth/use-session'
import { createWallet, updateWallet } from './api/wallets-api'
import { walletsKey, walletsQueryOptions } from './api/wallets-queries'

export function useWallets() {
  const session = useSession()
  const userId = session.user?.id ?? ''
  return useQuery({ ...walletsQueryOptions(userId), enabled: session.user !== null })
}

type SaveVariables = { walletId: string | null; body: CreateWalletRequest }

export function useSaveWallet() {
  const queryClient = useQueryClient()
  const session = useSession()
  const userId = session.user?.id ?? ''

  return useMutation({
    mutationFn: ({ walletId, body }: SaveVariables) =>
      walletId ? updateWallet(walletId, body) : createWallet(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletsKey(userId) }),
  })
}
