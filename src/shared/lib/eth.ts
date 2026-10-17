import Decimal from 'decimal.js'
import type { EthAmount } from '@/contracts/common'

const ETH_DECIMALS = 18

const EthDecimal = Decimal.clone({
  precision: 60,
  rounding: Decimal.ROUND_DOWN,
  toExpNeg: -40,
  toExpPos: 40,
})

function toDecimal(amount: EthAmount) {
  return new EthDecimal(amount)
}

function toAmount(value: Decimal) {
  return value.toDecimalPlaces(ETH_DECIMALS, Decimal.ROUND_DOWN).toFixed()
}

export function ethAdd(a: EthAmount, b: EthAmount): EthAmount {
  return toAmount(toDecimal(a).plus(toDecimal(b)))
}

export function ethSub(a: EthAmount, b: EthAmount): EthAmount {
  return toAmount(toDecimal(a).minus(toDecimal(b)))
}

export function ethMultiply(amount: EthAmount, quantity: number): EthAmount {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new RangeError('A quantidade deve ser um número inteiro não negativo')
  }
  return toAmount(toDecimal(amount).times(quantity))
}

export function ethSum(amounts: readonly EthAmount[]): EthAmount {
  return toAmount(
    amounts.reduce((total, amount) => total.plus(toDecimal(amount)), new EthDecimal(0)),
  )
}

export function ethCompare(a: EthAmount, b: EthAmount): -1 | 0 | 1 {
  return toDecimal(a).comparedTo(toDecimal(b)) as -1 | 0 | 1
}

export function ethEquals(a: EthAmount, b: EthAmount) {
  return ethCompare(a, b) === 0
}

export function ethIsZero(amount: EthAmount) {
  return toDecimal(amount).isZero()
}

type FormatEthOptions = {
  minimumFractionDigits?: number
}

export function formatEth(amount: EthAmount, { minimumFractionDigits = 2 }: FormatEthOptions = {}) {
  const fixed = toDecimal(amount).toFixed(ETH_DECIMALS, Decimal.ROUND_DOWN)
  const [integer = '0', fraction = ''] = fixed.split('.')
  let trimmed = fraction.replace(/0+$/, '')
  if (trimmed.length < minimumFractionDigits) {
    trimmed = trimmed.padEnd(minimumFractionDigits, '0')
  }
  return trimmed.length > 0 ? `${integer}.${trimmed}` : integer
}

export function formatEthWithSymbol(amount: EthAmount, options?: FormatEthOptions) {
  return `${formatEth(amount, options)} ETH`
}

export function parseEthInput(raw: string): EthAmount | null {
  const normalized = raw.trim().replace(',', '.')
  if (!/^\d+(\.\d{1,18})?$/.test(normalized)) {
    return null
  }
  return toAmount(toDecimal(normalized))
}

export function ethToCents(amount: EthAmount): number {
  return toDecimal(amount).times(100).toDecimalPlaces(0, Decimal.ROUND_DOWN).toNumber()
}

export function ethFromCents(cents: number): EthAmount {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError('Os centavos devem ser um número inteiro não negativo')
  }
  return toAmount(new EthDecimal(cents).dividedBy(100))
}
