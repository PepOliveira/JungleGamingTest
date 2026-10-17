import { Skeleton } from '@/shared/ui/skeleton'

export function NftDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid gap-8 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-10"
    >
      <p role="status" className="sr-only">
        Carregando detalhes do NFT
      </p>
      <div
        className="mx-7 mt-16 lg:m-0 lg:grid lg:grid-cols-[100px_minmax(0,1fr)] lg:gap-5"
        aria-hidden="true"
      >
        <div className="hidden flex-col gap-4 lg:flex">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-xl bg-secondary" />
          ))}
        </div>
        <Skeleton className="aspect-[6/7] rounded-t-3xl bg-secondary lg:aspect-square lg:rounded-2xl" />
      </div>
      <div className="flex flex-col gap-5 px-6 lg:px-0" aria-hidden="true">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-14 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-2/3" />
      </div>
    </div>
  )
}
