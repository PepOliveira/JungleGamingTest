import { Link } from '@tanstack/react-router'
import { Loader2, XCircle } from 'lucide-react'
import type { Order } from '@/contracts/order'
import { providerLabels } from '@/features/wallets/labels'
import { formatEthWithSymbol } from '@/shared/lib/eth'
import { Button } from '@/shared/ui/button'

const cardClass =
  'mx-auto flex w-full max-w-[580px] flex-col items-center gap-4 border-b-[10px] border-primary bg-card px-6 py-12 text-center'

export function OrderPendingCard({ order }: { order: Order }) {
  return (
    <section aria-labelledby="pending-title" className={cardClass} aria-busy="true">
      <Loader2
        className="size-10 animate-spin text-primary motion-reduce:animate-none"
        aria-hidden="true"
      />
      <h1 id="pending-title" className="text-base font-bold">
        Processando seu pedido
      </h1>
      <p role="status" className="max-w-sm text-sm text-warm">
        Estamos aguardando a confirmação da sua carteira ({providerLabels[order.walletProvider]})
        para o total de {formatEthWithSymbol(order.total)}. Você pode recarregar a página: o pedido
        continua sendo acompanhado.
      </p>
    </section>
  )
}

export function OrderDeclinedCard({ order }: { order: Order }) {
  return (
    <section aria-labelledby="declined-title" className={cardClass}>
      <XCircle className="size-10 text-destructive" aria-hidden="true" />
      <h1 id="declined-title" className="text-base font-bold">
        Pagamento recusado
      </h1>
      <p role="alert" className="max-w-sm text-sm text-warm">
        {order.declineReason ?? 'A carteira recusou o pagamento.'} Nada foi cobrado e seus itens
        continuam no carrinho.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="font-bold">
          <Link to="/pagamento">Tentar novamente</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="border-primary text-primary">
          <Link to="/carrinho">Voltar ao carrinho</Link>
        </Button>
      </div>
    </section>
  )
}
