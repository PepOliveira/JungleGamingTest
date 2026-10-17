import type { Image } from '@/contracts/common'
import { imageSrcSet } from '@/shared/lib/image'
import { cn } from '@/shared/lib/utils'

type ResponsiveImageProps = {
  image: Image
  sizes: string
  priority?: boolean
  maxWidth?: number
  className?: string
}

export function ResponsiveImage({
  image,
  sizes,
  priority = false,
  maxWidth,
  className,
}: ResponsiveImageProps) {
  return (
    <img
      src={image.url}
      srcSet={imageSrcSet(image.url, maxWidth)}
      sizes={sizes}
      alt={image.alt}
      width={640}
      height={640}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn('size-full object-cover', className)}
    />
  )
}
