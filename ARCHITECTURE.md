# Arquitetura

Este documento descreve como o front-end da Kurio está organizado, as decisões que moldaram a base de código e os desvios e limitações conhecidos. Para executar o projeto, veja o [README](README.md).

## Visão geral

SPA em React 19 com TanStack Router (rotas por arquivo) e TanStack Query. A "API" é um conjunto de handlers MSW que roda no navegador; o app não sabe disso: ele fala com `/api` por Axios e com um servidor Socket.IO, ambos descritos por **contratos** compartilhados.

```
UI (routes, features/*/components)
  └─ hooks de feature (useQuery / useMutation)
       └─ api de feature (funções finas)
            └─ shared/api (Axios, erros normalizados, validação com Zod)
                 └─ contracts  ◄────────────  mocks (handlers MSW, servidor Socket.IO)
```

A direção das dependências é sempre para baixo; `contracts` não importa nada da aplicação, e os mocks só dependem de `contracts` e de utilitários.

## Estrutura por feature

Cada área (`catalog`, `nft-detail`, `auth`, `favorites`, `cart`, `profile`, `wallets`, `account`, `checkout`, `orders`, `realtime`) concentra seus componentes, hooks, chamadas de API, chaves de cache e testes. O que é genuinamente comum fica em `shared/` (`ui`, `layout`, `api`, `lib`, `config`). As rotas em `src/routes` são finas: validam a URL e montam a página da feature.

## Contratos (`src/contracts`)

Schemas Zod são a fonte única de verdade para requisições, respostas, erros e eventos de tempo real. Os tipos TypeScript são inferidos deles (`z.infer`).

- **Valores em ETH** são strings decimais (até 18 casas) validadas por `ethAmountSchema`; toda aritmética passa por `shared/lib/eth` (`decimal.js`). Nunca se usa `number` para dinheiro, o que evita erros de ponto flutuante e perda de precisão.
- **Erros** têm um corpo único (`code`, `message`, `fieldErrors`, `details`) com códigos estáveis (`validation_error`, `unauthorized`, `session_expired`, `quote_outdated`, `idempotency_conflict`, `coupon_invalid`, `coupon_expired`, `availability_conflict`, `wallet_conflict`, entre outros).
- **Eventos** (`realtime.ts`) carregam `eventId`, `version`, `occurredAt` e o recurso; o de pedido ainda carrega `userId`.
- As respostas são **validadas em tempo de execução** (`apiRequest(config, schema)`): uma resposta fora do contrato vira um erro `contract`, em vez de propagar dados inválidos para a UI.

## Cliente HTTP e erros

`shared/api/http-client.ts` cria a instância Axios (base URL e timeout vindos de env), injeta o `Authorization` e normaliza qualquer falha em `ApiError` com um `kind` (`validation`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `transient`, `network`, `timeout`, `canceled`, `contract`). O `kind` decide o comportamento:

- `transient`, `network` e `timeout` são **retentáveis**; o TanStack Query repete até 2 vezes com backoff exponencial. 4xx de validação, 401, 404 e 409 nunca são repetidos.
- Mutações não repetem, com uma exceção deliberada: a criação de pedido (abaixo).
- `serialize-params` serializa filtros de forma estável (arrays repetidos, ordem determinística), o que também estabiliza as chaves de cache.

## Estado na URL

Filtros, aba, ordenação, página e busca do catálogo vivem na URL e são validados por um schema Zod com `.catch(undefined)`, então URLs adulteradas ou antigas degradam para o padrão em vez de quebrar. O diálogo de login/cadastro também é dirigido pela URL (`auth`, `retorno`, `motivo`), o que torna o fluxo compartilhável, funciona com o botão voltar e permite devolver o usuário ao destino original após o login. Os padrões são aplicados em `normalizeCatalogSearch`, não gravados na URL.

## Política de sessão

- O token fica no `localStorage` (`kurio:session`) com a expiração. `sessionStore` é um store externo (`useSyncExternalStore`) com `onStart` e `onEnd`, usado para reagir ao início e ao fim da sessão sem acoplar features.
- Uma resposta 401 **para uma requisição que enviou token** encerra a sessão, limpa os dados privados, anuncia o motivo e abre o login com `motivo=sessao-expirada` e o destino em `retorno`. 401 sem token (visitante) não dispara isso.
- Ao encerrar a sessão, `resetPrivateData` cancela e remove do cache todas as consultas privadas (`session`, `favorites`, `cart`, `orders`, `profile`, `wallets`). As chaves privadas incluem o id do usuário, então um segundo usuário no mesmo navegador nunca enxerga dados do primeiro.
- O evento `storage` sincroniza abas: sair em uma aba derruba a sessão nas outras.
- `requireAuthenticated` protege rotas privadas no `beforeLoad`.

**Limitação consciente:** o token em `localStorage` fica exposto a XSS; em produção o ideal é um cookie `httpOnly` emitido pelo backend. Como a API é simulada, mantivemos o token acessível ao cliente.

## Carrinho

O carrinho é **estado do servidor**: a UI nunca soma preços. Cada mutação (adicionar, alterar quantidade, remover, aplicar ou remover cupom) devolve o carrinho completo com `summary` (subtotal, desconto, taxa, total) calculado pela API, e o resultado substitui o cache. Isso garante que a tela mostre o mesmo valor que será cobrado.

- **Visitante:** o carrinho vive no servidor sob um identificador enviado no cabeçalho `X-Guest-Cart`. Ao entrar, `mergeGuestCartIntoUser` o funde ao carrinho do usuário (respeitando `MAX_QUANTITY_PER_ITEM` e o estoque) e invalida o cache.
- Linhas carregam `available`; o checkout bloqueia a confirmação quando a quantidade excede o estoque.
- Botões de quantidade usam `aria-disabled` (e não `disabled`) durante a mutação, para não perder o foco do teclado.

## Pagamento e pedidos

1. **Cotação (`quote`)** por rede, com taxa de rede própria e validade de 2 minutos. O checkout mostra o total da cotação, não o do carrinho.
2. **Conexão de carteira** simulada (aceita ou recusada conforme o cenário) devolve um `connectionId`, exigido para criar o pedido.
3. **Pedido idempotente:** `POST /orders` envia `Idempotency-Key`, derivada de uma impressão digital do conteúdo (cotação, carteira, conexão, coletor, nota) e guardada em `sessionStorage`. Repetir a mesma chave com o mesmo conteúdo devolve o mesmo pedido; a mesma chave com conteúdo diferente devolve 409 `idempotency_conflict`. Por isso o clique duplo gera um único pedido, e por isso esta é a única mutação com retry: se a resposta for perdida (timeout depois de o servidor ter criado o pedido), a nova tentativa recupera o pedido existente em vez de criar outro.
4. **Revalidação:** o servidor refaz a cotação ao criar o pedido; se preço ou disponibilidade mudaram, responde 409 `quote_outdated` com a cotação nova. A UI substitui a cotação, mostra "valores mudaram" e exige nova confirmação ("Confirmar com os novos valores"). Quando o item esgota, a resposta é `availability_conflict`.
5. **Liquidação:** o pedido nasce `pending`; passa a `confirmed` (hash e link do explorer, estoque baixado, itens removidos do carrinho) ou `declined`. O app acompanha por polling (1,5 s enquanto pendente) e por evento `order.updated`.
6. **Recuperação:** o id do pedido pendente é persistido por usuário; recarregar a página ou voltar a `/pagamento` redireciona para o pedido em andamento.

## Cache (TanStack Query)

| Dado                                 | Chave                                                          | Política                                                                                |
| ------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Lista e destaques do catálogo        | `['nfts', 'list', query]`, `['nfts', 'featured']`              | `keepPreviousData` na lista (sem piscar ao paginar); destaques com `staleTime` de 5 min |
| Detalhe e relacionados               | `['nfts', 'detail', id]`                                       | atualizado por eventos; relacionados com `staleTime` de 5 min                           |
| Sessão, favoritos, perfil, carteiras | `['session']`, `['favorites', userId]`, ...                    | privados, removidos ao sair                                                             |
| Carrinho                             | `['cart', ownerKey]` (`ownerKey` é o id do usuário ou `guest`) | `staleTime` de 30 s; mutações gravam a resposta                                         |
| Cotação                              | `['cart', userId, 'quote', rede]`                              | sob a raiz `cart`, então invalidar o carrinho recarrega a cotação                       |
| Pedido                               | `['orders', userId, orderId]`                                  | `refetchInterval` enquanto `pending`                                                    |

**Favoritos** usam atualização otimista: `onMutate` cancela consultas em andamento, guarda o estado anterior e aplica a mudança; `onError` restaura o estado anterior e anuncia o erro; `onSettled` revalida. As mutações compartilham um `scope` para serem serializadas e não se cruzarem.

## Tempo real

O servidor (nos mocks) fala Socket.IO v5 sobre WebSocket. O cliente (`features/realtime`) é um singleton por sessão, criado por `RealtimeBridge` e recriado quando o token muda (visitante, login, logout), o que impede qualquer vazamento de eventos entre usuários.

- **Dois eventos:** `nft.updated` (preço, preço original, disponibilidade e edições; transmitido a todos) e `order.updated` (status, hash, link e motivo da recusa; entregue apenas ao dono). Ambos trazem estado completo, não delta.
- **Ordem e duplicidade:** cada evento tem `eventId` estável e `version` monotônica. Um `EventLedger` limitado (200 ids) descarta ids repetidos, e a mescla só aplica o evento se `event.version > version em cache`. Assim, eventos duplicados ou antigos são inofensivos e a ordem de chegada não importa.
- **Aplicação:** o evento de NFT atualiza detalhe, listas, destaques e relacionados no cache; se o NFT está no carrinho, o carrinho (e a cotação) é invalidado e há aviso visível; no checkout, o botão de confirmar fica desativado durante a recarga e aparece o banner de valores alterados. O evento de pedido só é aplicado se `userId` for o do usuário logado.
- **Reconciliação:** ao reconectar, o app invalida `nfts`, `cart` e `orders` e busca de novo por REST, porque eventos perdidos durante a queda não são reenviados. A REST é a fonte da verdade; o socket é uma otimização.
- **Degradação:** sem socket, o app continua funcional (o pedido pendente segue em polling) e anuncia a indisponibilidade uma vez por queda.
- **Ciclo de vida:** ao desmontar, `removeAllListeners` e `disconnect` liberam tudo. Um erro `unauthorized` no handshake encerra a conexão sem laço de reconexão.

## Mocks (MSW)

- **Banco em memória persistido** em `localStorage` (`kurio:mock-db`) com `SCHEMA_VERSION`; mudar fixtures ou formato exige incrementar a versão para invalidar bancos antigos.
- **Handlers REST** por domínio, validando o corpo com os mesmos schemas Zod e respondendo com o mesmo formato de erro. A latência vem de um gerador pseudoaleatório com semente, então os cenários são reprodutíveis.
- **Servidor Socket.IO próprio** sobre `ws.link` do MSW. Implementamos o subconjunto necessário do protocolo (Engine.IO v4 e Socket.IO v5: abertura, ping, conexão com `auth`, eventos e fechamento) em vez de usar `@mswjs/socket.io-binding`, que não funcionou com o MSW 3 e não cobre autenticação nem queda controlada. Em MSW 3 o prefixo `/socket.io/` é removido do caminho, então o handler usa só a origem.
- **Liquidação de pedidos** acontece sob demanda (ao consultar) e também por temporizador quando há clientes conectados, publicando `order.updated` e `nft.updated` (estoque).
- **Falhas injetáveis** (`faults`): um handler coringa, registrado primeiro, responde com status, erro de rede ou nunca responde (timeout). As regras são persistidas, então sobrevivem a recarregamentos.
- **Inicialização:** o código dos mocks é um chunk separado, carregado como entrada paralela (`src/mocks/boot.ts`) e fora do bundle principal. O app renderiza imediatamente; requisições e a abertura do socket aguardam `whenRuntimeReady()`. Um detalhe importante: `engine.io-client` captura o `WebSocket` global ao ser importado, então `socket.io-client` precisa ser importado só depois de o MSW iniciar.
- **Service worker reiniciado pelo navegador:** o navegador encerra o service worker depois de ~30 s ocioso e, ao reiniciá-lo, o MSW esquece quais abas estão ativas e deixa as chamadas passarem para o servidor estático (404). Por isso `src/mocks/worker-keepalive.ts` reenvia `MOCK_ACTIVATE` antes de cada requisição (`setRequestPreflight`, chamado por `whenRuntimeReady`) e mantém um batimento a cada 10 s. Há um teste E2E que derruba o worker pelo protocolo do DevTools (`e2e/mock-worker.spec.ts`).

## Acessibilidade

- Marcação semântica, rótulos, `aria-live` para anúncios (`announce`) e `aria-busy` em skeletons; erros de formulário com `role="alert"`, `aria-invalid` e `aria-describedby`, e foco no primeiro campo inválido.
- Diálogos (Radix) prendem o foco; o de login, dirigido pela URL, devolve o foco ao elemento que o abriu.
- Link "Pular para o conteúdo"; indicadores de foco visíveis; `prefers-reduced-motion` respeitado (shimmer e animações).
- O token `--destructive` foi ajustado para atingir contraste 4,5:1 sobre o fundo dos cartões.
- Cobertura automatizada: axe (WCAG A e AA, 2.1 e 2.2) em todas as telas principais e testes de teclado e foco.

## Desempenho

- Rotas divididas automaticamente (`autoCodeSplitting`), diálogo de autenticação carregado sob demanda e mocks em chunk próprio; o bundle principal tem cerca de 344 KB (110 KB gzip), e os chunks do runtime dos mocks são pré-carregados pelo HTML (`modulepreload`, injetado por um plugin em `vite.config.ts`) para baixarem em paralelo com o app.
- Imagens em WebP com `srcset` de 320, 640 e 960 px e `sizes` por uso; a imagem principal tem `fetchpriority="high"` e não usa animação de entrada, para não atrasar o LCP.
- Skeletons têm altura equivalente à do conteúdo final, evitando deslocamento de layout (CLS) e o "pulo" do rodapé.
- Resultados e justificativas em [docs/lighthouse.md](docs/lighthouse.md).

## Qualidade e CI

TypeScript estrito (`noUncheckedIndexedAccess`), ESLint (inclui regras de hooks e `consistent-type-imports`), Prettier, Vitest e Playwright. O workflow de CI roda typecheck, lint, formatação, testes unitários e build, e depois os E2E de `desktop` e `mobile`, publicando o relatório como artefato. A medição de Lighthouse roda sob demanda (`workflow_dispatch`).

## Desvios, decisões e limitações

- **Ícones:** `lucide-react` e `react-icons` (marcas) no lugar dos ícones exportados do Figma, por consistência e peso.
- **Figma:** no desenho do detalhe, os rótulos Rede, Contrato e Direitos autorais estavam trocados; o pareamento foi corrigido. A aba de avaliações aparece como indisponível. O botão de favoritar fica sempre visível nos cards. A busca no desktop abre em diálogo.
- **Medição contra o Figma:** os quadros em 1440 px e 414 px foram comparados com a aplicação pixel a pixel. O conteúdo tem 1200 px de largura útil no desktop; a escala tipográfica do tema (`--text-xs`, `--text-sm`, `--text-base` e os tamanhos maiores) foi ajustada para 14, 16 e 18 px a partir de 768 px, e permanece em 12, 14 e 16 px no mobile, onde o desenho usa esses valores. O cabeçalho, o rodapé (colunas de 248, 266 e 303 px, divisores e círculos de 74 px), as linhas do carrinho (miniatura de 70 px colada na borda) e as margens laterais do mobile seguem as medidas do desenho.
- **Desvios mantidos de propósito:** o recibo aparece dentro do cabeçalho e do rodapé do app (o quadro do Figma mostra só o cartão); o coração de favoritar fica sempre visível nos cards (no desenho aparece só ao passar o mouse); no mobile as miniaturas da galeria ficam sobre a imagem para permitir a navegação; a seleção de provedor no pagamento usa cartões com ícone e mais altura que as linhas do desenho; a ordem dos provedores e os dados exibidos vêm das fixtures e não coincidem com os do quadro.
- **Telas sem desenho mobile** (perfil, carteiras e recibo) foram projetadas por nós a partir da versão desktop. O Figma tinha "Usar outra carteira?"; foi substituído por cartões de seleção de carteira, e o formulário de carteira reproduz todos os campos do desenho.
- **Páginas ainda não construídas** (blog, ajuda, política etc.) levam a `/indisponivel?secao=...`, uma página honesta em vez de links mortos.
- **Token em `localStorage`**, como descrito acima.
- **MSW em produção:** a demo publicada roda os mocks no navegador (service worker). Isso soma custo de inicialização que um backend real não teria, e é o principal limite do desempenho em mobile (veja o Lighthouse).
- **Baselines visuais** são específicas do ambiente em que foram geradas e não rodam no CI.
