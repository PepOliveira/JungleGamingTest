import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'

type StatusPageProps = {
  code?: string
  title: string
  description: string
}

export function StatusPage({ code, title, description }: StatusPageProps) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      {code ? <p className="text-5xl font-bold tracking-widest text-primary">{code}</p> : null}
      <h1 className="text-2xl font-bold tracking-wide uppercase">{title}</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      <Button asChild size="lg" className="mt-2 uppercase">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
