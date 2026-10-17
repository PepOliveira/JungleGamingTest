import { describe, expect, it } from 'vitest'
import { authSearchSchema, sanitizeReturnPath, stripAuthParams } from './search'

const origin = 'http://localhost:5173'

describe('authSearchSchema', () => {
  it('accepts valid modes and reasons', () => {
    expect(authSearchSchema.parse({ auth: 'cadastro', motivo: 'sessao-expirada' })).toEqual({
      auth: 'cadastro',
      motivo: 'sessao-expirada',
      retorno: undefined,
    })
  })

  it('ignores invalid values instead of failing', () => {
    expect(authSearchSchema.parse({ auth: 'hack', motivo: 'x', retorno: 12 })).toEqual({
      auth: undefined,
      motivo: undefined,
      retorno: undefined,
    })
  })
})

describe('stripAuthParams', () => {
  it('removes only the auth related parameters', () => {
    expect(
      stripAuthParams('/nfts/nft_1?edicao=e1&auth=entrar&motivo=sessao-expirada#a', origin),
    ).toBe('/nfts/nft_1?edicao=e1#a')
  })

  it('keeps clean urls untouched', () => {
    expect(stripAuthParams('/?page=2', origin)).toBe('/?page=2')
  })
})

describe('sanitizeReturnPath', () => {
  it('accepts internal paths and drops auth params', () => {
    expect(sanitizeReturnPath('/pagamento?auth=entrar', origin)).toBe('/pagamento')
  })

  it('rejects external or protocol-relative targets', () => {
    expect(sanitizeReturnPath('https://evil.example/x', origin)).toBeUndefined()
    expect(sanitizeReturnPath('//evil.example/x', origin)).toBeUndefined()
    expect(sanitizeReturnPath('/\\evil.example', origin)).toBeUndefined()
    expect(sanitizeReturnPath(undefined, origin)).toBeUndefined()
  })
})
