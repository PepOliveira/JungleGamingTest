import { Skeleton } from '@/shared/ui/skeleton'

export function CartSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
      <p role="status" className="sr-only">
        Carregando carrinho
      </p>
      <ul className="flex flex-col gap-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index}>
            <Skeleton className="h-[110px] rounded-xl lg:h-[86px]" />
          </li>
        ))}
      </ul>
      <div className="hidden flex-col gap-4 lg:flex" aria-hidden="true">
        <Skeleton className="h-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
