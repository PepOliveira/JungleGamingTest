import { Search } from 'lucide-react'
import { useCallback, useEffect, useId, useRef } from 'react'
import type { FormEvent } from 'react'
import { useDebouncedCallback } from '@/shared/hooks/use-debounced-callback'
import { cn } from '@/shared/lib/utils'

type SearchFieldProps = {
  value: string
  onCommit: (value: string) => void
  label: string
  placeholder: string
  commitOnType?: boolean
  autoFocus?: boolean
  className?: string
}

const DEBOUNCE_MS = 300

export function SearchField({
  value,
  onCommit,
  label,
  placeholder,
  commitOnType = true,
  autoFocus = false,
  className,
}: SearchFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const lastCommitted = useRef(value)

  const commit = useCallback(
    (next: string) => {
      lastCommitted.current = next
      onCommit(next)
    },
    [onCommit],
  )
  const commitDebounced = useDebouncedCallback(commit, DEBOUNCE_MS)

  useEffect(() => {
    if (value !== lastCommitted.current && inputRef.current) {
      inputRef.current.value = value
      lastCommitted.current = value
    }
  }, [value])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    commit(inputRef.current?.value.trim() ?? '')
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        'flex h-12 items-center gap-3 rounded-xl bg-card px-4 focus-within:ring-2 focus-within:ring-ring',
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="search"
        name="q"
        defaultValue={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        maxLength={80}
        onChange={(event) => {
          if (commitOnType) {
            commitDebounced(event.target.value.trim())
          }
        }}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </form>
  )
}
