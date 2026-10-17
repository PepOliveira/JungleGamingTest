export const AVATAR_SIZE = 256
export const AVATAR_MAX_FILE_BYTES = 5 * 1024 * 1024
export const AVATAR_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export function validateAvatarFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!(AVATAR_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return 'Use uma imagem PNG, JPG ou WebP.'
  }
  if (file.size > AVATAR_MAX_FILE_BYTES) {
    return 'A imagem deve ter no máximo 5 MB.'
  }
  return null
}

export async function fileToAvatarDataUrl(file: File, size = AVATAR_SIZE): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Não foi possível processar a imagem.')
  }

  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  )
  bitmap.close()

  const webp = canvas.toDataURL('image/webp', 0.85)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85)
}
