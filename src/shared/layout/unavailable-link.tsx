import { Link } from '@tanstack/react-router'
import type { LinkComponentProps } from '@tanstack/react-router'

type UnavailableLinkProps = Omit<LinkComponentProps<'a'>, 'to' | 'search' | 'params' | 'from'> & {
  secao: string
}

export function UnavailableLink({ secao, ...props }: UnavailableLinkProps) {
  return <Link {...props} to="/indisponivel" search={{ secao }} />
}
