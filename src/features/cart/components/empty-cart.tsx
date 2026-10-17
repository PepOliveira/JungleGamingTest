import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/shared/ui/button'

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-14 text-center">
      <ShoppingCart className="size-9 text-primary" aria-hidden="true" />
      <h2 className="text-base font-bold">Seu carrinho está vazio</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Explore o catálogo e adicione os NFTs que você quer colecionar.
      </p>
      <Button asChild size="lg" className="mt-2">
        <Link to="/">Explorar NFTs</Link>
      </Button>
    </div>
  )
}
