import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-16">
      <h1 className="text-2xl font-bold tracking-wide uppercase">Início</h1>
    </div>
  )
}
