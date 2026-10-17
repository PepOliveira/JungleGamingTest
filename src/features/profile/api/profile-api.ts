import { userSchema } from '@/contracts/auth'
import type { ChangePasswordRequest, UpdateProfileRequest } from '@/contracts/profile'
import { endpoints } from '@/contracts/endpoints'
import { apiCommand, apiRequest } from '@/shared/api/request'

export function fetchProfile(signal?: AbortSignal) {
  return apiRequest({ url: endpoints.profile.root, signal }, userSchema)
}

export function updateProfile(body: UpdateProfileRequest) {
  return apiRequest({ method: 'PUT', url: endpoints.profile.root, data: body }, userSchema)
}

export function updateAvatar(avatar: string | null) {
  return apiRequest({ method: 'PUT', url: endpoints.profile.avatar, data: { avatar } }, userSchema)
}

export function changePassword(body: ChangePasswordRequest) {
  return apiCommand({ method: 'POST', url: endpoints.profile.password, data: body })
}
