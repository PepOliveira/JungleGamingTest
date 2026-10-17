import { Slider as SliderPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

type SliderProps = ComponentProps<typeof SliderPrimitive.Root> & {
  thumbLabels?: readonly string[]
}

export function Slider({ className, thumbLabels, ...props }: SliderProps) {
  const values = props.value ?? props.defaultValue ?? [0]

  return (
    <SliderPrimitive.Root
      className={cn('relative flex h-5 w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-border">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={thumbLabels?.[index]}
          className="block size-4 rounded-full border-2 border-primary bg-background outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}
