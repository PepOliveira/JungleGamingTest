import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { ResponsiveImage } from '@/shared/ui/responsive-image'
import { Skeleton } from '@/shared/ui/skeleton'
import { featuredNftsQueryOptions } from '../api/catalog-queries'

const SLIDE_COUNT = 3
const HERO_SIZES = '(min-width: 768px) 480px, 150px'

export function Hero() {
  const { data, isPending } = useQuery(featuredNftsQueryOptions())
  const [active, setActive] = useState(0)

  const slides = data?.items.slice(0, SLIDE_COUNT) ?? []
  const current = slides[active] ?? slides[0]
  const next = slides.length > 1 ? slides[(active + 1) % slides.length] : undefined

  return (
    <section
      aria-labelledby="hero-title"
      className="relative mb-8 grid grid-cols-[1fr_auto] items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#3a2415] to-card p-4 pb-9 md:mb-16 md:grid-cols-2 md:gap-10 md:rounded-none md:bg-none md:p-0"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -left-16 size-72 -translate-y-1/2 rounded-full bg-white/[0.04] md:hidden"
      />
      <div className="relative flex flex-col gap-3 md:gap-6 md:py-12">
        <p className="text-[11px] text-foreground md:text-sm">Bem-vindo à Kurio</p>
        <h1
          id="hero-title"
          className="text-[17px] leading-snug font-bold uppercase md:text-4xl md:leading-snug"
        >
          <span className="md:hidden">Seja dono da cultura digital</span>
          <span className="hidden md:inline">Seja dono do futuro da arte digital</span>
        </h1>
        <p className="max-w-md text-xs leading-relaxed text-warm md:text-sm">
          <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
          <span className="hidden md:inline">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
            rara, apoie artistas e tenha uma parte da cultura da internet.
          </span>
        </p>
        <Button asChild size="lg" className="h-10 w-fit px-6 font-bold uppercase max-md:hidden">
          <a href="#catalogo">Explorar</a>
        </Button>
        <a
          href="#catalogo"
          className="flex w-fit items-center gap-2 rounded-sm text-xs font-bold text-primary uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        >
          Explorar
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>

      {slides.length > 1 ? (
        <div
          role="group"
          aria-label="Destaques"
          className="flex gap-1 max-md:absolute max-md:right-[52px] max-md:bottom-1.5 md:order-3 md:col-start-1 md:-mt-6 md:ml-[-0.375rem]"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Mostrar destaque ${index + 1}: ${slide.name}`}
              aria-current={index === active}
              onClick={() => setActive(index)}
              className="flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  'size-2 rounded-full transition-colors',
                  index === active ? 'bg-primary' : 'bg-primary/40',
                )}
              />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative w-[150px] md:w-full md:max-w-[480px] md:justify-self-end">
        {isPending || !current ? (
          <Skeleton className="aspect-square rounded-2xl bg-secondary md:rounded-3xl" />
        ) : (
          <>
            <Link
              to="/nfts/$nftId"
              params={{ nftId: current.id }}
              aria-label={`Ver ${current.name}`}
              className="block aspect-square overflow-hidden rounded-2xl bg-canvas outline-none focus-visible:ring-2 focus-visible:ring-ring md:rounded-3xl"
            >
              <ResponsiveImage
                key={current.id}
                image={current.image}
                sizes={HERO_SIZES}
                priority
                className="motion-safe:animate-in motion-safe:fade-in-0"
              />
            </Link>
            {next ? (
              <div
                aria-hidden="true"
                className="absolute -bottom-3 -left-6 size-[68px] overflow-hidden rounded-xl border-[3px] border-[#3a2415] bg-canvas md:hidden"
              >
                <ResponsiveImage image={next.image} sizes="68px" />
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
