import { GUEST_CART_HEADER } from '@/contracts/endpoints'
import { authenticate } from './auth'
import { errorResponse } from './errors'

type Owner = { key: string; userId: string | null; guestToken: string | null; error?: undefined }
type Rejected = { error: Response }

const MIN_GUEST_TOKEN_LENGTH = 8

export function readGuestToken(request: Request) {
  const token = request.headers.get(GUEST_CART_HEADER)
  return token && token.length >= MIN_GUEST_TOKEN_LENGTH ? token : null
}

export function resolveCartOwner(request: Request): Owner | Rejected {
  const guestToken = readGuestToken(request)

  if (request.headers.has('Authorization')) {
    const result = authenticate(request)
    if (result.error) {
      return { error: result.error }
    }
    return { key: `user:${result.user.id}`, userId: result.user.id, guestToken }
  }

  if (!guestToken) {
    return {
      error: errorResponse(400, 'validation_error', 'Identificação do carrinho ausente'),
    }
  }
  return { key: `guest:${guestToken}`, userId: null, guestToken }
}
