import { useNavigate } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import type { NftSummary } from '@/contracts/nft'
import { stripAuthParams } from '@/features/auth/search'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useFavoriteIds, useToggleFavorite } from '../use-favorites'

type FavoriteButtonProps = {
  nft: NftSummary
  variant?: 'icon' | 'labeled'
  className?: string
}

export function FavoriteButton({ nft, variant = 'icon', className }: FavoriteButtonProps) {
  const navigate = useNavigate()
  const { ids, userId } = useFavoriteIds()
  const toggle = useToggleFavorite(userId)
  const isFavorite = ids.has(nft.id)

  function handleClick() {
    if (!userId) {
      const returnTo = stripAuthParams(window.location.href, window.location.origin)
      void navigate({
        to: '.',
        search: (previous) => ({ ...previous, auth: 'entrar' as const, retorno: returnTo }),
        resetScroll: false,
      })
      return
    }
    toggle.mutate({ nft, favorite: !isFavorite })
  }

  if (variant === 'labeled') {
    return (
      <Button
        type="button"
        size="lg"
        variant="outline"
        aria-pressed={isFavorite}
        onClick={handleClick}
        className={cn('h-10 gap-2 border-primary px-4 text-primary', className)}
      >
        <Heart className={cn(isFavorite && 'fill-current')} aria-hidden="true" />
        {isFavorite ? 'Favoritado' : 'Favoritar'}
      </Button>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
      onClick={handleClick}
      className={cn(
        'flex size-9 items-center justify-center rounded-md bg-card/90 text-primary transition-colors outline-none hover:text-primary-bright focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Heart className={cn('size-5', isFavorite && 'fill-current')} aria-hidden="true" />
    </button>
  )
}
