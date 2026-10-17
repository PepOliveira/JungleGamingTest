import { Star } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Rating = {
  average: number
  count: number
}

const formatAverage = (average: number) => average.toFixed(1).replace('.', ',')

export function StarRating({ average, count }: Rating) {
  const filled = Math.round(average)

  return (
    <p className="flex items-center gap-2 text-xs">
      <span
        role="img"
        aria-label={`Nota ${formatAverage(average)} de 5`}
        className="flex items-center gap-0.5"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            aria-hidden="true"
            className={cn(
              'size-3.5',
              index < filled ? 'fill-primary text-primary' : 'text-primary/30',
            )}
          />
        ))}
      </span>
      <span>{count} avaliações de colecionadores</span>
    </p>
  )
}

export function RatingBadge({ average, count }: Rating) {
  return (
    <p className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-3 py-1 text-xs font-bold">
      <Star aria-hidden="true" className="size-3.5 fill-primary text-primary" />
      <span>
        <span className="sr-only">Nota </span>
        {formatAverage(average)}
        <span className="font-normal text-warm">
          <span className="sr-only"> com </span>({count})
          <span className="sr-only"> avaliações</span>
        </span>
      </span>
    </p>
  )
}
