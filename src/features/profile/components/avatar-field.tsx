import { ImagePlus } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { User } from '@/contracts/auth'
import { toApiError } from '@/shared/api/api-error'
import { announce } from '@/shared/lib/announcer'
import { Button } from '@/shared/ui/button'
import { AVATAR_ACCEPTED_TYPES, fileToAvatarDataUrl, validateAvatarFile } from '../avatar-image'
import { useUpdateAvatar } from '../use-profile'

type AvatarFieldProps = {
  user: User
}

export function AvatarField({ user }: AvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const updateAvatar = useUpdateAvatar()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const busy = processing || updateAvatar.isPending

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const problem = validateAvatarFile(file)
    if (problem) {
      setError(problem)
      return
    }

    setError(null)
    setProcessing(true)
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      await updateAvatar.mutateAsync(dataUrl)
      announce('Avatar atualizado', { visible: true })
    } catch (failure) {
      setError(toApiError(failure).fieldErrors.avatar?.[0] ?? toApiError(failure).message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleRemove() {
    setError(null)
    try {
      await updateAvatar.mutateAsync(null)
      announce('Avatar removido', { visible: true })
    } catch (failure) {
      setError(toApiError(failure).message)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p id="avatar-label" className="text-sm">
        Avatar
      </p>
      <div role="group" aria-labelledby="avatar-label" className="flex items-center gap-5">
        <div className="flex size-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2f1d15] text-primary">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar atual" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-5" aria-hidden="true" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPTED_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-label="Escolher imagem de avatar"
          onChange={handleFile}
        />
        <Button
          type="button"
          size="lg"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="h-10 px-6 font-bold"
        >
          {busy ? 'Enviando...' : 'Alterar'}
        </Button>
        <button
          type="button"
          disabled={busy || !user.avatarUrl}
          onClick={handleRemove}
          className="rounded-sm text-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          Remover
        </button>
      </div>
      <p role="alert" className="min-h-4 text-xs text-destructive">
        {error}
      </p>
    </div>
  )
}
