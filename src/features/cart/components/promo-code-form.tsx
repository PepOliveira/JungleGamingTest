import { X } from 'lucide-react'
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { toApiError } from '@/shared/api/api-error'
import { Button } from '@/shared/ui/button'
import { useApplyCoupon, useRemoveCoupon } from '../use-cart'

type PromoCodeFormProps = {
  couponCode: string | null
  disabled: boolean
}

export function PromoCodeForm({ couponCode, disabled }: PromoCodeFormProps) {
  const inputId = useId()
  const errorId = useId()
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const code = String(new FormData(form).get('code') ?? '').trim()

    if (!code) {
      setError('Informe o código promocional')
      return
    }

    try {
      await apply.mutateAsync(code)
      setError(null)
      form.reset()
    } catch (failure) {
      const apiError = toApiError(failure)
      setError(apiError.fieldErrors.code?.[0] ?? apiError.message)
    }
  }

  if (couponCode) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold">Código promocional</p>
        <div className="flex items-center justify-between gap-3 rounded-md border border-primary px-3 py-2 text-sm">
          <span>
            Cupom <strong className="text-primary">{couponCode}</strong> aplicado
          </span>
          <button
            type="button"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
            className="flex items-center gap-1 rounded-sm text-xs text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" aria-hidden="true" />
            Remover
            <span className="sr-only"> cupom {couponCode}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-bold">
        Código promocional
      </label>
      <div className="flex">
        <input
          id={inputId}
          name="code"
          type="text"
          autoComplete="off"
          maxLength={32}
          disabled={disabled}
          placeholder="Digite o código promocional..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={() => setError(null)}
          className="h-10 min-w-0 flex-1 rounded-l-full border border-border bg-transparent px-4 text-xs outline-none placeholder:text-warm/70 focus:border-primary aria-[invalid=true]:border-destructive disabled:opacity-50 lg:rounded-l-sm"
        />
        <Button
          type="submit"
          size="lg"
          disabled={disabled || apply.isPending}
          className="h-10 rounded-l-none rounded-r-full bg-gradient-to-b from-[#c98b55] to-[#8c5c34] px-6 font-bold lg:rounded-r-sm lg:bg-primary lg:bg-none"
        >
          {apply.isPending ? 'Aplicando...' : 'Aplicar'}
        </Button>
      </div>
      <p id={errorId} role="alert" className="min-h-4 text-xs text-destructive">
        {error}
      </p>
    </form>
  )
}
