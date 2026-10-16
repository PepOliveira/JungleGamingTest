import { describe, expect, it } from 'vitest'
import { serializeParams } from './serialize-params'

describe('serializeParams', () => {
  it('repeats keys for arrays', () => {
    expect(serializeParams({ collections: ['musica', 'jogos'] })).toBe(
      'collections=musica&collections=jogos',
    )
  })

  it('skips empty values', () => {
    expect(serializeParams({ q: '', tab: undefined, sort: null, page: 2 })).toBe('page=2')
  })

  it('encodes special characters', () => {
    expect(serializeParams({ q: 'arte & cia' })).toBe('q=arte+%26+cia')
  })

  it('keeps zero and false', () => {
    expect(serializeParams({ page: 0, flag: false })).toBe('page=0&flag=false')
  })
})
