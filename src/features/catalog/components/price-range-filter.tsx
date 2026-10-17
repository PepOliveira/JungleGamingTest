import { useState } from 'react'
import type { EthAmount } from '@/contracts/common'
import { ethFromCents, ethToCents, formatEth } from '@/shared/lib/eth'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Slider } from '@/shared/ui/slider'

type PriceRangeFilterProps = {
  bounds: { min: EthAmount; max: EthAmount } | undefined
  value: { min: EthAmount | undefined; max: EthAmount | undefined }
  onApply: (range: { priceMin: EthAmount | undefined; priceMax: EthAmount | undefined }) => void
}

const formatLabel = (cents: number) => formatEth(ethFromCents(cents)).replace('.', ',')

export function PriceRangeFilter({ bounds, value, onApply }: PriceRangeFilterProps) {
  if (!bounds) {
    return (
      <div className="flex flex-col gap-3" aria-hidden="true">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  const boundsMin = ethToCents(bounds.min)
  const boundsMax = ethToCents(bounds.max)
  const applied: [number, number] = [
    value.min ? Math.max(ethToCents(value.min), boundsMin) : boundsMin,
    value.max ? Math.min(ethToCents(value.max), boundsMax) : boundsMax,
  ]

  return (
    <PriceRangeControl
      key={`${boundsMin}-${boundsMax}-${applied[0]}-${applied[1]}`}
      boundsMin={boundsMin}
      boundsMax={boundsMax}
      initial={applied}
      onApply={onApply}
    />
  )
}

type PriceRangeControlProps = {
  boundsMin: number
  boundsMax: number
  initial: [number, number]
  onApply: PriceRangeFilterProps['onApply']
}

function PriceRangeControl({ boundsMin, boundsMax, initial, onApply }: PriceRangeControlProps) {
  const [range, setRange] = useState<[number, number]>(initial)
  const [low, high] = range

  return (
    <div className="flex flex-col gap-3">
      <Slider
        min={boundsMin}
        max={boundsMax}
        step={1}
        minStepsBetweenThumbs={1}
        value={range}
        onValueChange={(next) => {
          const [nextLow, nextHigh] = next
          if (nextLow !== undefined && nextHigh !== undefined) {
            setRange([nextLow, nextHigh])
          }
        }}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
      />
      <p className="text-xs" aria-live="polite">
        Preço: {formatLabel(low)} - {formatLabel(high)} ETH
      </p>
      <Button
        size="lg"
        className="self-start"
        onClick={() =>
          onApply({
            priceMin: low === boundsMin ? undefined : ethFromCents(low),
            priceMax: high === boundsMax ? undefined : ethFromCents(high),
          })
        }
      >
        Aplicar
      </Button>
    </div>
  )
}
