import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { cn } from '@/shared/lib/utils'
import { relatedNftsQueryOptions } from '../api/nft-detail-queries'

type RelatedNftsProps = {
  nftId: string
}

const cardClass = 'w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[calc((100%-4*1.5rem)/5)]'

export function RelatedNfts({ nftId }: RelatedNftsProps) {
  const { data, isPending, isError } = useQuery(relatedNftsQueryOptions(nftId))
  const scrollerRef = useRef<HTMLUListElement | null>(null)
  const [pages, setPages] = useState({ current: 0, total: 1 })

  const measure = useCallback(() => {
    const element = scrollerRef.current
    if (!element || element.clientWidth === 0) return
    const total = Math.max(1, Math.round(element.scrollWidth / element.clientWidth))
    const current = Math.min(total - 1, Math.round(element.scrollLeft / element.clientWidth))
    setPages((previous) =>
      previous.current === current && previous.total === total ? previous : { current, total },
    )
  }, [])

  const attach = useCallback(
    (element: HTMLUListElement | null) => {
      scrollerRef.current = element
      if (!element) return
      const observer = new ResizeObserver(measure)
      observer.observe(element)
      return () => observer.disconnect()
    },
    [measure],
  )

  function goToPage(index: number) {
    const element = scrollerRef.current
    if (!element) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollTo({
      left: index * element.clientWidth,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  if (isError || (data && data.items.length === 0)) {
    return null
  }

  return (
    <section aria-labelledby="related-title">
      <h2
        id="related-title"
        className="border-b border-border pb-3 text-base font-bold text-primary"
      >
        Mais desta coleção
      </h2>
      <ul
        ref={attach}
        onScroll={measure}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isPending
          ? Array.from({ length: 5 }, (_, index) => (
              <NftCardSkeleton key={index} className={cardClass} />
            ))
          : data.items.map((item) => <NftCard key={item.id} nft={item} className={cardClass} />)}
      </ul>
      {pages.total > 1 ? (
        <div
          role="group"
          aria-label="Páginas de NFTs relacionados"
          className="mt-4 flex justify-center gap-2"
        >
          {Array.from({ length: pages.total }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir para o grupo ${index + 1} de ${pages.total}`}
              aria-current={index === pages.current}
              onClick={() => goToPage(index)}
              className="flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  'size-2.5 rounded-full border border-primary',
                  index === pages.current && 'bg-primary',
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
