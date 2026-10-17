import { Mail } from 'lucide-react'
import { FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'

type ShareLinksProps = {
  title: string
}

const linkClass =
  'flex size-7 items-center justify-center rounded-sm text-foreground transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring'

export function ShareLinks({ title }: ShareLinksProps) {
  const url = typeof window === 'undefined' ? '' : window.location.href
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm font-bold">Compartilhar este NFT:</p>
      <ul className="flex items-center gap-1">
        <li>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no LinkedIn (abre em nova aba)"
            className={linkClass}
          >
            <FaLinkedinIn className="size-4" aria-hidden="true" />
          </a>
        </li>
        <li>
          <a
            href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
            aria-label="Compartilhar por e-mail"
            className={linkClass}
          >
            <Mail className="size-4" aria-hidden="true" />
          </a>
        </li>
        <li>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no X (abre em nova aba)"
            className={linkClass}
          >
            <FaXTwitter className="size-4" aria-hidden="true" />
          </a>
        </li>
      </ul>
    </div>
  )
}
