import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

const controlClass =
  'h-10 w-full rounded-sm border border-[#3f2319] bg-background px-3 text-sm text-foreground outline-none placeholder:text-warm/60 focus:border-primary read-only:opacity-70 disabled:opacity-60 aria-[invalid=true]:border-destructive'

type FieldShellProps = {
  id: string
  label: string
  hideLabel?: boolean
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

function FieldShell({
  id,
  label,
  hideLabel,
  required,
  error,
  hint,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className={cn('text-sm', hideLabel && 'sr-only')}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-[#f0805f]">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (obrigatório)</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  hideLabel?: boolean
  required?: boolean
  error?: string
  hint?: string
  fieldClassName?: string
}

export function TextField({
  label,
  hideLabel,
  required,
  error,
  hint,
  fieldClassName,
  className,
  ...props
}: TextFieldProps) {
  const id = useId()

  return (
    <FieldShell
      id={id}
      label={label}
      hideLabel={hideLabel}
      required={required}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-required={required || undefined}
        className={cn(controlClass, className)}
        {...props}
      />
    </FieldShell>
  )
}

export function PasswordTextField({
  label,
  required,
  error,
  hint,
  fieldClassName,
  className,
  ...props
}: TextFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(controlClass, 'pr-11', className)}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-primary/70 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? (
            <Eye className="size-4" aria-hidden="true" />
          ) : (
            <EyeOff className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </FieldShell>
  )
}

type Option = { value: string; label: string }

type SelectFieldProps = Omit<ComponentProps<'select'>, 'id'> & {
  label: string
  options: readonly Option[]
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  fieldClassName?: string
}

export function SelectField({
  label,
  options,
  placeholder,
  required,
  error,
  hint,
  fieldClassName,
  className,
  ...props
}: SelectFieldProps) {
  const id = useId()

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(controlClass, 'appearance-none pr-9', className)}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </FieldShell>
  )
}

type EnsFieldProps = {
  label: string
  required?: boolean
  error?: string
  suffixProps: Omit<ComponentProps<'select'>, 'id' | 'children'>
  nameProps: Omit<ComponentProps<'input'>, 'id'>
  suffixes: readonly string[]
  fieldClassName?: string
}

export function EnsField({
  label,
  required,
  error,
  suffixProps,
  nameProps,
  suffixes,
  fieldClassName,
}: EnsFieldProps) {
  const id = useId()

  return (
    <FieldShell id={id} label={label} required={required} error={error} className={fieldClassName}>
      <div className="flex gap-2">
        <div className="relative w-[78px] shrink-0">
          <select
            aria-label="Sufixo do nome ENS"
            className={cn(controlClass, 'appearance-none px-2 pr-6')}
            {...suffixProps}
          >
            {suffixes.map((suffix) => (
              <option key={suffix} value={suffix}>
                {suffix}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={controlClass}
          {...nameProps}
        />
      </div>
    </FieldShell>
  )
}

type TextAreaFieldProps = Omit<ComponentProps<'textarea'>, 'id'> & {
  label: string
  error?: string
  hint?: string
  fieldClassName?: string
}

export function TextAreaField({
  label,
  error,
  hint,
  fieldClassName,
  className,
  ...props
}: TextAreaFieldProps) {
  const id = useId()

  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={fieldClassName}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(controlClass, 'h-32 resize-y py-2', className)}
        {...props}
      />
    </FieldShell>
  )
}
