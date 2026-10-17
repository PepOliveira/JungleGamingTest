const ELLIPSIS = '…'
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function shortenMiddle(value: string, start = 6, end = 4) {
  if (value.length <= start + end + 1) {
    return value
  }
  return `${value.slice(0, start)}${ELLIPSIS}${value.slice(-end)}`
}

export function formatReceiptDate(iso: string) {
  const date = new Date(iso)
  const month = MONTHS[date.getUTCMonth()] ?? ''
  return `${String(date.getUTCDate()).padStart(2, '0')} ${month}, ${date.getUTCFullYear()}`
}
