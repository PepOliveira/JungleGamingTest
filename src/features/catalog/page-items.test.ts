import { describe, expect, it } from 'vitest'
import { getPageItems } from './page-items'
import type { PageItem } from './page-items'

function describeItems(items: PageItem[]) {
  return items.map((item) => (item.type === 'page' ? item.page : '…'))
}

describe('getPageItems', () => {
  it('lists every page when there are few', () => {
    expect(describeItems(getPageItems(1, 4))).toEqual([1, 2, 3, 4])
  })

  it('collapses distant pages around the current one', () => {
    expect(describeItems(getPageItems(1, 20))).toEqual([1, 2, '…', 20])
    expect(describeItems(getPageItems(10, 20))).toEqual([1, '…', 9, 10, 11, '…', 20])
    expect(describeItems(getPageItems(20, 20))).toEqual([1, '…', 19, 20])
  })

  it('does not insert a gap between adjacent pages', () => {
    expect(describeItems(getPageItems(3, 9))).toEqual([1, 2, 3, 4, '…', 9])
  })

  it('returns nothing without pages', () => {
    expect(getPageItems(1, 0)).toEqual([])
  })
})
