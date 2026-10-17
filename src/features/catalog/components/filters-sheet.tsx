import type { ReactNode } from 'react'
import { Button } from '@/shared/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'
import { FiltersPanel } from './filters-panel'

type FiltersSheetProps = {
  trigger: ReactNode
}

export function FiltersSheet({ trigger }: FiltersSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom">
        <div className="flex flex-col gap-1 pr-8">
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Refine o catálogo por coleção, preço e rede.</SheetDescription>
        </div>
        <FiltersPanel includeSort />
        <SheetClose asChild>
          <Button size="lg" className="h-10 w-full">
            Ver resultados
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  )
}
