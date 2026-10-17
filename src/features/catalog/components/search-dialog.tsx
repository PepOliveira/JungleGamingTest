import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import { SearchField } from './search-field'

export function SearchDialog() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Buscar"
          className="rounded-sm p-1 text-foreground transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="size-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="top">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <div className="flex flex-col gap-1 pr-8">
            <SheetTitle>Buscar NFTs</SheetTitle>
            <SheetDescription>Procure por nome, criador ou coleção.</SheetDescription>
          </div>
          <SearchField
            value=""
            label="Buscar NFTs"
            placeholder="Explorar coleções"
            commitOnType={false}
            autoFocus
            onCommit={(q) => {
              setOpen(false)
              void navigate({ to: '/', search: q ? { q } : {}, hash: 'catalogo' })
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
