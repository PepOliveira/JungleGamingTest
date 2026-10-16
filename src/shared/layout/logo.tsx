import { Link } from '@tanstack/react-router'

export function Logo() {
  return (
    <Link
      to="/"
      aria-label="Kurio, ir para o início"
      className="rounded-sm text-[14px] leading-none font-bold tracking-[0.1em] text-foreground"
    >
      KURIO
    </Link>
  )
}
