import { MAX_QUANTITY_PER_ITEM } from '@/contracts/cart'
import type { Edition } from '@/contracts/nft'

export const MAX_QUANTITY_PER_ORDER = MAX_QUANTITY_PER_ITEM

export type EditionSelection = {
  edition: Edition | null
  quantity: number
  maxQuantity: number
  soldOut: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function resolveSelection(
  editions: readonly Edition[],
  editionId: string | undefined,
  requestedQuantity: number,
  defaultEditionId?: string,
): EditionSelection {
  const isAvailable = (candidate: Edition) => candidate.available > 0
  const edition =
    editions.find((candidate) => candidate.id === editionId && isAvailable(candidate)) ??
    editions.find((candidate) => candidate.id === defaultEditionId && isAvailable(candidate)) ??
    editions.find(isAvailable) ??
    null

  if (!edition) {
    return { edition: null, quantity: 0, maxQuantity: 0, soldOut: true }
  }

  const maxQuantity = Math.min(edition.available, MAX_QUANTITY_PER_ORDER)
  const quantity = clamp(
    Number.isFinite(requestedQuantity) ? Math.trunc(requestedQuantity) : 1,
    1,
    maxQuantity,
  )

  return { edition, quantity, maxQuantity, soldOut: false }
}
