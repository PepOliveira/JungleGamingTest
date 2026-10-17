import { Link } from '@tanstack/react-router'
import { User } from 'lucide-react'
import { useSession } from '../use-session'

const tabClass =
  'flex size-12 items-center justify-center rounded-full text-warm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function MobileProfileTab() {
  const session = useSession()

  if (session.status === 'authenticated') {
    return (
      <Link to="/perfil" activeProps={{ className: 'text-primary' }} className={tabClass}>
        <User className="size-[18px]" fill="currentColor" aria-hidden="true" />
        <span className="sr-only">Perfil</span>
      </Link>
    )
  }

  return (
    <Link
      to="."
      search={(previous) => ({ ...previous, auth: 'entrar' as const })}
      resetScroll={false}
      className={tabClass}
    >
      <User className="size-[18px]" fill="currentColor" aria-hidden="true" />
      <span className="sr-only">Entrar</span>
    </Link>
  )
}
