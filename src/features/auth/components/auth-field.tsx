import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

type AuthFieldProps = ComponentProps<'input'> & {
  label: string
  error?: string
}

const inputClass =
  'h-12 w-full rounded-xl border border-border bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-warm/70 focus:border-primary aria-[invalid=true]:border-destructive md:h-10 md:rounded-sm'

export function AuthField({ label, error, className, id, ...props }: AuthFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(inputClass, className)}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function PasswordField({ label, error, id, ...props }: AuthFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = `${fieldId}-error`
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(inputClass, 'pr-12')}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-primary/60 transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? (
            <Eye className="size-4" aria-hidden="true" />
          ) : (
            <EyeOff className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
