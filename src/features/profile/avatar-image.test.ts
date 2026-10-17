import { describe, expect, it } from 'vitest'
import { AVATAR_MAX_FILE_BYTES, validateAvatarFile } from './avatar-image'

describe('validateAvatarFile', () => {
  it('accepts supported image types within the size limit', () => {
    expect(validateAvatarFile({ type: 'image/png', size: 1000 })).toBeNull()
    expect(validateAvatarFile({ type: 'image/jpeg', size: AVATAR_MAX_FILE_BYTES })).toBeNull()
    expect(validateAvatarFile({ type: 'image/webp', size: 10 })).toBeNull()
  })

  it('rejects other types', () => {
    expect(validateAvatarFile({ type: 'image/gif', size: 10 })).toMatch(/PNG, JPG ou WebP/)
    expect(validateAvatarFile({ type: 'application/pdf', size: 10 })).not.toBeNull()
  })

  it('rejects files above the limit', () => {
    expect(validateAvatarFile({ type: 'image/png', size: AVATAR_MAX_FILE_BYTES + 1 })).toMatch(
      /5 MB/,
    )
  })
})
