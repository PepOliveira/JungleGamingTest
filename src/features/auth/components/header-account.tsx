import { Link } from '@tanstack/react-router'
import { ChevronDown, LogIn } from 'lucide-react'
import type { User } from '@/contracts/auth'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Skeleton } from '@/shared/ui/skeleton'
import { useLogout } from '../use-auth-mutations'
import { useSession } from '../use-session'

type UserMenuProps = {
  user: User
}

function UserMenu({ user }: UserMenuProps) {
  const logout = useLogout()
  const initial = user.name.trim().charAt(0).toUpperCase() || '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 max-w-52 items-center gap-2 rounded-md border border-border px-2 text-sm outline-none transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              aria-hidden="true"
              className="size-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
            >
              {initial}
            </span>
          )}
          <span className="truncate">{user.name}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Abrir menu da conta</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/perfil">Meu perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/perfil/carteiras">Carteiras</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={logout.isPending}
          onSelect={() => {
            logout.mutate()
          }}
        >
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function HeaderAccount() {
  const session = useSession()

  if (session.status === 'loading') {
    return <Skeleton className="h-9 w-24" />
  }

  if (session.status === 'authenticated') {
    return <UserMenu user={session.user} />
  }

  return (
    <Button asChild size="lg" className="gap-2 text-base font-medium">
      <Link
        to="."
        search={(previous) => ({ ...previous, auth: 'entrar' as const })}
        resetScroll={false}
      >
        <LogIn aria-hidden="true" />
        Entrar
      </Link>
    </Button>
  )
}
