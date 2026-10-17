import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@/contracts/auth'
import { sessionKey } from '@/features/auth/api/auth-queries'
import { useSession } from '@/features/auth/use-session'
import { changePassword, updateAvatar, updateProfile } from './api/profile-api'
import { profileKey, profileQueryOptions } from './api/profile-queries'

export function useProfile() {
  const session = useSession()
  const userId = session.user?.id ?? ''
  return useQuery({ ...profileQueryOptions(userId), enabled: session.user !== null })
}

function useProfileCache() {
  const queryClient = useQueryClient()
  const session = useSession()
  const userId = session.user?.id ?? ''

  return (user: User) => {
    queryClient.setQueryData(profileKey(userId), user)
    queryClient.setQueryData(sessionKey, (current: { expiresAt: string } | undefined) =>
      current ? { ...current, user } : current,
    )
  }
}

export function useUpdateProfile() {
  const store = useProfileCache()
  return useMutation({ mutationFn: updateProfile, onSuccess: store })
}

export function useUpdateAvatar() {
  const store = useProfileCache()
  return useMutation({ mutationFn: updateAvatar, onSuccess: store })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}
