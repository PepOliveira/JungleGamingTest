import { ZoomIn, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useState } from 'react'
import type { Image } from '@/contracts/common'
import { cn } from '@/shared/lib/utils'
import { ResponsiveImage } from '@/shared/ui/responsive-image'

type NftGalleryProps = {
  images: readonly Image[]
}

export function NftGallery({ images }: NftGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = images[selectedIndex] ?? images[0]

  if (!selected) {
    return null
  }

  return (
    <section
      aria-label="Galeria de imagens"
      className="relative lg:grid lg:grid-cols-[100px_minmax(0,1fr)] lg:items-start lg:gap-5"
    >
      {images.length > 1 ? (
        <ul className="absolute bottom-14 left-12 z-10 flex gap-2 lg:static lg:flex-col lg:gap-4">
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`}>
              <button
                type="button"
                aria-label={`Ver imagem ${index + 1} de ${images.length}: ${image.alt}`}
                aria-pressed={index === selectedIndex}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'block size-10 overflow-hidden rounded-lg border-2 border-background/70 bg-canvas opacity-80 transition outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring lg:size-auto lg:aspect-square lg:w-full lg:rounded-xl lg:border-transparent lg:opacity-70',
                  index === selectedIndex && 'border-primary opacity-100',
                )}
              >
                <ResponsiveImage image={image} sizes="100px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative mx-7 mt-16 overflow-hidden rounded-t-3xl bg-canvas lg:m-0 lg:rounded-2xl lg:bg-card lg:p-5">
        <div className="aspect-[6/7] overflow-hidden bg-canvas lg:aspect-square lg:rounded-xl">
          <ResponsiveImage
            key={selected.url}
            image={selected}
            sizes="(min-width: 1024px) 440px, 90vw"
            maxWidth={960}
            priority
          />
        </div>
        <DialogPrimitive.Root>
          <DialogPrimitive.Trigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="absolute top-4 right-4 hidden size-9 items-center justify-center rounded-full bg-background/80 text-foreground transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring lg:top-7 lg:right-7 lg:flex"
            >
              <ZoomIn className="size-5" aria-hidden="true" />
            </button>
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-3 outline-none">
              <DialogPrimitive.Title className="sr-only">Imagem ampliada</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                {selected.alt}
              </DialogPrimitive.Description>
              <div className="aspect-square overflow-hidden rounded-xl bg-canvas">
                <ResponsiveImage image={selected} sizes="720px" maxWidth={960} />
              </div>
              <DialogPrimitive.Close className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-background/80 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
                <X className="size-5" aria-hidden="true" />
                <span className="sr-only">Fechar</span>
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>
    </section>
  )
}
