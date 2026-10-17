export type PageItem = { type: 'page'; page: number } | { type: 'gap'; key: string }

export function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => ({ type: 'page', page: index + 1 }))
  }

  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  const items: PageItem[] = []
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1]
    if (previous !== undefined && page - previous > 1) {
      items.push({ type: 'gap', key: `gap-${previous}` })
    }
    items.push({ type: 'page', page })
  })
  return items
}
