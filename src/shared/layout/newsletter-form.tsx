import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/shared/ui/button'

type FormStatus = 'idle' | 'invalid' | 'unavailable'

const messages: Record<Exclude<FormStatus, 'idle'>, string> = {
  invalid: 'Informe um e-mail válido.',
  unavailable: 'A inscrição na newsletter não está disponível nesta versão.',
}

export function NewsletterForm() {
  const inputId = useId()
  const messageId = useId()
  const [status, setStatus] = useState<FormStatus>('idle')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(event.currentTarget.checkValidity() ? 'unavailable' : 'invalid')
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex">
        <label htmlFor={inputId} className="sr-only">
          E-mail
        </label>
        <input
          id={inputId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="digite seu e-mail..."
          aria-invalid={status === 'invalid'}
          aria-describedby={status === 'idle' ? undefined : messageId}
          className="h-10 min-w-0 flex-1 rounded-l-md bg-secondary px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
        <Button type="submit" size="lg" className="h-10 rounded-l-none px-4 text-sm font-bold">
          Enviar
        </Button>
      </div>
      <p id={messageId} role="status" className="min-h-4 text-xs text-warm">
        {status === 'idle' ? '' : messages[status]}
      </p>
    </form>
  )
}
