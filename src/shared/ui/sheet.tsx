import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

type SheetSide = 'left' | 'bottom' | 'top'

const sideClasses: Record<SheetSide, string> = {
  left: 'inset-y-0 left-0 w-[88vw] max-w-sm data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
  bottom:
    'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
  top: 'inset-x-0 top-0 rounded-b-2xl data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
}

type SheetContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  side?: SheetSide
}

export function SheetContent({ side = 'left', className, children, ...props }: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col gap-4 overflow-y-auto bg-card p-6 shadow-2xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm p-1 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-lg font-bold', className)} {...props} />
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}
