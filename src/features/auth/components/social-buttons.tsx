import { useState } from 'react'
import { FaFacebookF } from 'react-icons/fa6'
import { FcGoogle } from 'react-icons/fc'

const buttonClass =
  'flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-transparent text-xs font-bold text-warm transition-colors outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:rounded-sm'

export function SocialButtons() {
  const [notice, setNotice] = useState<string | null>(null)

  function showUnavailable(provider: string) {
    setNotice(`O acesso com ${provider} não está disponível nesta versão.`)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span>Ou continue com</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <button type="button" className={buttonClass} onClick={() => showUnavailable('o Google')}>
        <FcGoogle className="size-5" aria-hidden="true" />
        Continuar com Google
      </button>
      <button type="button" className={buttonClass} onClick={() => showUnavailable('o Facebook')}>
        <FaFacebookF className="size-4 text-[#3b5998]" aria-hidden="true" />
        Continuar com Facebook
      </button>
      <p role="status" className="min-h-4 text-center text-xs text-warm">
        {notice}
      </p>
    </div>
  )
}
