# Kurio – NFT Marketplace

Front-end de um marketplace de NFTs em React + TypeScript. A API REST e o canal de tempo real (Socket.IO) são simulados no navegador com MSW, a partir dos mesmos contratos tipados usados pela aplicação.

- Demo: _(URL pública do deploy — preencher após a publicação)_
- Arquitetura e decisões: [ARCHITECTURE.md](ARCHITECTURE.md)
- Contratos REST e eventos: [docs/contracts.md](docs/contracts.md)
- Resultados do Lighthouse: [docs/lighthouse.md](docs/lighthouse.md)

## Stack

React 19, TypeScript 6 (strict), Vite 8, TanStack Router (rotas por arquivo, filtros na URL), TanStack Query v5, Axios, Zod 4, React Hook Form, Tailwind CSS v4 com componentes no estilo shadcn/ui (Radix), `decimal.js` para valores em ETH, Socket.IO client, MSW 3 (REST + WebSocket), Vitest e Playwright (E2E, acessibilidade com axe e regressão visual).

## Como rodar

Requisitos: Node 22 ou superior e npm.

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. Nenhum backend é necessário: o MSW responde às chamadas `/api` e ao WebSocket.

### Comandos

| Comando              | O que faz                                                            |
| -------------------- | -------------------------------------------------------------------- |
| `npm run dev`        | servidor de desenvolvimento                                          |
| `npm run build`      | typecheck e build de produção em `dist/`                             |
| `npm run preview`    | serve o build de produção                                            |
| `npm run typecheck`  | `tsc -b` (app, config e E2E)                                         |
| `npm run lint`       | ESLint                                                               |
| `npm run format`     | Prettier (`format:check` apenas verifica)                            |
| `npm test`           | testes unitários e de handlers (Vitest)                              |
| `npm run e2e`        | Playwright: projetos `desktop`, `mobile` e `visual`                  |
| `npm run e2e:ui`     | Playwright em modo interativo                                        |
| `npm run e2e:report` | abre o relatório HTML do último run                                  |
| `npm run lighthouse` | build, `vite preview` e Lighthouse (3 execuções, mediana) em `docs/` |

Cada teste E2E parte de um estado isolado (contexto novo do navegador, banco dos mocks recém-semeado). O relatório HTML fica em `playwright-report/` e os traces das falhas em `test-results/`. Os testes sobem o próprio servidor de desenvolvimento na porta 5174 (`E2E_PORT` para trocar). As baselines visuais ficam em `e2e/__screenshots__` e foram geradas no Windows; para atualizá-las use `npx playwright test --project=visual --update-snapshots`. No CI roda-se apenas `desktop` e `mobile`, porque a renderização de fontes difere entre sistemas.

## Variáveis de ambiente

Todas são opcionais; os valores padrão estão em `.env.example`.

| Variável                  | Padrão    | Descrição                                                                     |
| ------------------------- | --------- | ----------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`       | `/api`    | base das chamadas REST                                                        |
| `VITE_SOCKET_URL`         | vazio     | URL do Socket.IO; vazio usa o endereço simulado (mocks) ou a origem da página |
| `VITE_ENABLE_MOCKS`       | `true`    | liga o MSW (REST e WebSocket). Com `false` o app fala com a API real          |
| `VITE_MOCK_SCENARIO`      | `default` | cenário inicial dos mocks (veja abaixo)                                       |
| `VITE_REQUEST_TIMEOUT_MS` | `10000`   | timeout das requisições Axios                                                 |

## Credenciais de demonstração

| Perfil                                                  | E-mail                   | Senha       |
| ------------------------------------------------------- | ------------------------ | ----------- |
| Colecionadora (perfil completo, 2 carteiras, favoritos) | `colecionador@kurio.dev` | `Kurio@123` |
| Criador (1 carteira, sem ENS)                           | `criadora@kurio.dev`     | `Kurio@456` |

Cupons: `KURIO10` (10%), `BEMVINDO` (0,05 ETH) e `EXPIRADO20` (expirado, para testar o erro).

## Cenários dos mocks

O estado dos mocks (usuários, favoritos, carrinhos, pedidos, estoque) é persistido no `localStorage` e sobrevive a recarregamentos. Em desenvolvimento e na demo há um painel de controle no console do navegador:

```js
__KURIO_MOCKS__.setScenario('payment-declined') // troca o cenário
__KURIO_MOCKS__.getScenario()
__KURIO_MOCKS__.reset() // volta o banco e as falhas ao estado inicial
```

Cenários disponíveis (também via `VITE_MOCK_SCENARIO`, ou salvos em `kurio:mock-scenario`):

| Cenário            | Efeito                                                    |
| ------------------ | --------------------------------------------------------- |
| `default`          | latência de 120–380 ms; pagamento confirma após 2,5 s     |
| `instant`          | sem latência e pagamento imediato (usado nos testes)      |
| `slow`             | latência de 1,8–2,6 s (para ver os skeletons com shimmer) |
| `payment-declined` | a carteira recusa o pagamento após 1,5 s                  |
| `wallet-refused`   | a carteira recusa a conexão antes da compra               |

Falhas pontuais e eventos de tempo real podem ser injetados sem trocar de cenário:

```js
__KURIO_MOCKS__.faults.add({ method: 'GET', path: '/nfts', effect: 'status', status: 500 })
__KURIO_MOCKS__.faults.add({ path: '/cart', effect: 'timeout', times: 1 }) // 'network' e 'timeout'
__KURIO_MOCKS__.faults.clear()
__KURIO_MOCKS__.faults.loseOrderResponses(1) // o pedido é criado, mas a resposta nunca chega
__KURIO_MOCKS__.expireSessions() // a próxima chamada autenticada recebe 401

__KURIO_MOCKS__.realtime.emitNftUpdate('nft_001', { price: '0.9', available: 3 })
__KURIO_MOCKS__.realtime.emitStaleNftUpdate('nft_001') // versão antiga: deve ser ignorada
__KURIO_MOCKS__.realtime.replayLastEvent() // mesmo eventId: deve ser ignorado
__KURIO_MOCKS__.realtime.emitForeignOrderUpdate('order_x') // evento de outro usuário
__KURIO_MOCKS__.realtime.goOffline() // derruba o socket; goOnline() reabre
```

## O que foi implementado

- **Catálogo** com filtros (coleção, rede, faixa de preço), busca, abas, ordenação e paginação inteiramente na URL; skeletons com shimmer e estados vazio e de erro.
- **Detalhe do NFT** com galeria, edições, limite de quantidade e itens relacionados.
- **Autenticação** (login, cadastro, expiração de sessão, rotas protegidas) por diálogo controlado pela URL; token no `localStorage`.
- **Favoritos** com atualização otimista e rollback.
- **Carrinho** de visitante mesclado ao entrar, cupom e totais calculados pela API.
- **Perfil e carteiras** (principal e secundária), avatar e troca de senha.
- **Pagamento** com cotação por rede, conexão de carteira, pedido idempotente (`Idempotency-Key`), revalidação de cotação (409 `quote_outdated`), estados pendente, confirmado e recusado, e recuperação do pedido pendente ao recarregar.
- **Tempo real** com `nft.updated` e `order.updated`: `eventId` e `version` estáveis, eventos repetidos ou antigos ignorados, eventos de pedido só para o dono, reconciliação por REST ao reconectar e listeners liberados ao desmontar.
- **Acessibilidade**: navegação por teclado, foco gerenciado em diálogos, regiões `aria-live`, link de pular conteúdo, `prefers-reduced-motion`; varredura axe sem violações nas telas principais.

## Testes

- **Unitários e de handlers (Vitest):** contratos, aritmética de ETH, cliente HTTP, handlers dos mocks, regras de carrinho e cotação, sessão, eventos em tempo real e o servidor de socket.
- **E2E (Playwright, Chromium, desktop 1440 e mobile 390):** catálogo, autenticação, detalhe, favoritos, carrinho, checkout, perfil e carteiras, tempo real, cenários de falha (500, queda de rede, timeout, 4xx, sessão expirada, cupons, preço e estoque mudando durante a compra, resposta de pedido perdida com recuperação idempotente), acessibilidade (axe) e teclado e foco.
- **Regressão visual:** home, detalhe, carrinho, pagamento e diálogo de login em 390, 768 e 1440.

## Estrutura

```
src/
  app/          bootstrap, query client e router
  contracts/    schemas Zod e tipos compartilhados entre app e mocks
  features/     catalog, nft-detail, auth, favorites, cart, profile, wallets,
                account, checkout, orders, realtime
  mocks/        banco em memória, handlers REST, servidor Socket.IO, cenários e falhas
  routes/       rotas por arquivo (TanStack Router)
  shared/       api, ui, layout, lib, config e hooks
e2e/            testes Playwright e baselines visuais
scripts/        medição do Lighthouse
```

## Deploy

O projeto é uma SPA estática. Há configuração pronta para a Vercel (`vercel.json`, com reescrita para `index.html` e cache de assets) e para Netlify e Cloudflare Pages (`public/_redirects`). Basta importar o repositório; o comando é `npm run build` e a saída é `dist/`. Como os mocks rodam no navegador, a demo publicada funciona sem backend.
