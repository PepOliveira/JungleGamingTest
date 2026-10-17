# Contratos REST e eventos

Os contratos são schemas Zod em [`src/contracts`](../src/contracts), compartilhados entre a aplicação e os mocks. Este documento resume o que eles descrevem; para os formatos exatos, o código é a referência (`endpoints.ts` para rotas e cabeçalhos, um arquivo por recurso para os corpos, `errors.ts` para erros e `realtime.ts` para eventos).

Convenções:

- **ETH** trafega como string decimal (até 18 casas), por exemplo `"0.016"`. Quantidades e versões são inteiros.
- Todas as respostas são **validadas em tempo de execução** com o schema do recurso; uma resposta fora do contrato vira um erro `contract` na aplicação.
- Rotas autenticadas usam `Authorization: Bearer <token>`.
- Base: `VITE_API_BASE_URL` (padrão `/api`).

## Cabeçalhos

| Cabeçalho         | Uso                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------- |
| `Authorization`   | token da sessão (`Bearer`)                                                            |
| `Idempotency-Key` | obrigatório em `POST /orders`; identifica a tentativa de compra                       |
| `X-Guest-Cart`    | identificador do carrinho do visitante (sem login); fundido ao carrinho ao autenticar |

## Erros

Toda falha tem o mesmo corpo:

```json
{
  "code": "quote_outdated",
  "message": "Os valores do pedido mudaram. Revise e confirme novamente.",
  "fieldErrors": { "email": ["E-mail inválido"] },
  "details": { "quote": {} }
}
```

`fieldErrors` e `details` são opcionais. Códigos e quando ocorrem:

| Código                                             | HTTP          | Quando                                                           |
| -------------------------------------------------- | ------------- | ---------------------------------------------------------------- |
| `validation_error`                                 | 400, 422      | corpo ou parâmetros inválidos (com `fieldErrors`)                |
| `unauthorized`                                     | 401           | sem token ou token inválido                                      |
| `session_expired`                                  | 401           | token válido, mas expirado                                       |
| `invalid_credentials`                              | 401           | e-mail ou senha incorretos                                       |
| `forbidden`                                        | 403           | sem permissão para o recurso                                     |
| `wallet_connection_refused`                        | 403           | a carteira recusou a conexão (simulação)                         |
| `not_found`                                        | 404           | recurso inexistente ou de outro usuário                          |
| `email_taken`, `username_taken`, `wallet_conflict` | 409           | conflito de cadastro ou de carteira                              |
| `availability_conflict`                            | 409           | quantidade indisponível (`details.items`)                        |
| `quote_outdated`                                   | 409           | a cotação mudou ou expirou (`details.quote` traz a nova)         |
| `idempotency_conflict`                             | 409           | mesma `Idempotency-Key` com conteúdo diferente                   |
| `coupon_invalid`, `coupon_expired`                 | 422           | cupom desconhecido ou vencido                                    |
| `transient_error`                                  | 502, 503, 504 | falha transitória; a aplicação repete automaticamente (leituras) |
| `internal_error`                                   | 500           | falha inesperada                                                 |

Na aplicação, o código e o status viram um `kind` (`validation`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `transient`, `network`, `timeout`, `canceled`, `contract`) que define o tratamento e se a chamada é retentável.

## Recursos REST

### Sessão e conta

| Método e rota         | Autenticação | Descrição                                                                    |
| --------------------- | ------------ | ---------------------------------------------------------------------------- |
| `POST /auth/register` | não          | cria a conta e já devolve a sessão (`201`); conflito em e-mail ou usuário    |
| `POST /auth/login`    | não          | devolve `{ accessToken, expiresAt, user }`; senha comparada por hash com sal |
| `GET /auth/session`   | sim          | usuário da sessão atual; `401` se inválida ou expirada                       |
| `POST /auth/logout`   | sim          | encerra a sessão (`204`)                                                     |

### NFTs

| Método e rota           | Descrição                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /nfts`             | lista paginada. Parâmetros: `q`, `collections[]`, `networks[]`, `priceMin`, `priceMax`, `tab` (`all`, `new`, `trending`), `sort`, `page`, `pageSize`. Devolve `items`, paginação e `facets` (contagens por coleção e rede, faixa de preço) |
| `GET /nfts/featured`    | destaques da home                                                                                                                                                                                                                          |
| `GET /nfts/:id`         | detalhe: galeria, edições (preço, disponibilidade, suprimento), atributos, contrato, royalties; `404` se não existir                                                                                                                       |
| `GET /nfts/:id/related` | NFTs relacionados                                                                                                                                                                                                                          |

Todo NFT carrega `version` (inteiro crescente), usada para ignorar eventos antigos.

### Favoritos (autenticado)

| Método e rota              | Descrição                   |
| -------------------------- | --------------------------- |
| `GET /favorites`           | favoritos do usuário        |
| `PUT /favorites/:nftId`    | inclui (idempotente)        |
| `DELETE /favorites/:nftId` | remove (`204`, idempotente) |

### Carrinho

Funciona para visitante (cabeçalho `X-Guest-Cart`) e para usuário autenticado. Toda mutação devolve o carrinho completo, com `summary` (`subtotal`, `discount`, `networkFee`, `total`) calculado pela API.

| Método e rota            | Descrição                                                                    |
| ------------------------ | ---------------------------------------------------------------------------- |
| `GET /cart`              | carrinho atual                                                               |
| `POST /cart/items`       | `{ nftId, editionId, quantity }`; respeita estoque e o máximo de 10 por item |
| `PATCH /cart/items/:id`  | altera a quantidade                                                          |
| `DELETE /cart/items/:id` | remove o item                                                                |
| `PUT /cart/coupon`       | `{ code }`; `422` com `coupon_invalid` ou `coupon_expired`                   |
| `DELETE /cart/coupon`    | remove o cupom                                                               |
| `POST /cart/merge`       | funde o carrinho do visitante ao do usuário                                  |

### Cotação

`POST /quotes` com `{ network }` valida cupom, disponibilidade, descontos e taxa de rede, e devolve a cotação (`201`; `id`, itens, `subtotal`, `discount`, `networkFee`, `total`, `expiresAt`, `network`). A cotação vale 2 minutos. Se algum item não está disponível, responde `409 availability_conflict`.

Taxas por rede: Ethereum `0.016`, Polygon `0.002`, Solana `0.0005` ETH.

### Carteiras (autenticado)

| Método e rota                    | Descrição                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `GET /wallets`                   | carteiras do usuário (principal e secundária)                                                                             |
| `POST /wallets`                  | cadastra (`201`); a secundária exige a principal; `wallet_conflict` em duplicidade                                        |
| `PUT /wallets/:id`               | atualiza                                                                                                                  |
| `POST /wallet-connections`       | simula a conexão: `{ walletId, provider }` devolve `connectionId` (`201`); pode responder `403 wallet_connection_refused` |
| `DELETE /wallet-connections/:id` | simula a desconexão (`204`)                                                                                               |

### Pedidos (autenticado)

| Método e rota     | Descrição                                                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /orders`    | cria o pedido. Exige `Idempotency-Key`. Corpo: `quoteId`, `walletId`, `connectionId`, `network`, `collector` (nome e e-mail), `note` opcional |
| `GET /orders`     | pedidos do usuário (filtro opcional `status`)                                                                                                 |
| `GET /orders/:id` | estado e recibo do pedido; `404` para pedido de outro usuário                                                                                 |

Regras de `POST /orders`:

- Mesma chave e mesmo conteúdo: devolve o **mesmo pedido** (`200`; a criação original responde `201`).
- Mesma chave e conteúdo diferente: `409 idempotency_conflict`.
- Sem a chave: `400 validation_error`.
- O servidor refaz a cotação; se mudou, `409 quote_outdated` com a cotação nova; se faltou estoque, `409 availability_conflict`.
- O pedido nasce `pending` e passa a `confirmed` (com `transactionHash` e `explorerUrl`; estoque baixado; itens comprados removidos do carrinho) ou `declined` (com `declineReason`). Ambos são terminais.
- O recibo é um **snapshot**: itens, preços, taxas e total ficam gravados no pedido e não mudam com o catálogo.

### Perfil (autenticado)

| Método e rota            | Descrição                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /profile`           | dados do colecionador                                                                                                                           |
| `PUT /profile`           | atualiza nome, e-mail, apelido, usuário e ENS; erros em `fieldErrors`                                                                           |
| `PUT /profile/avatar`    | `{ avatar }` (data URL de imagem) ou `null` para remover                                                                                        |
| `POST /profile/password` | `{ currentPassword, newPassword }` (`204`); senha atual incorreta responde `422` em `fieldErrors.currentPassword`; a senha é guardada como hash |

## Eventos em tempo real (Socket.IO)

Conexão: `auth: { token }` opcional. Visitantes recebem apenas `nft.updated`; com token válido, também `order.updated` dos próprios pedidos. Token inválido recebe `connect_error` com a mensagem `unauthorized`.

Todos os eventos carregam identidade estável e versão:

| Campo        | Descrição                                                    |
| ------------ | ------------------------------------------------------------ |
| `eventId`    | identificador único do evento (um reenvio mantém o mesmo id) |
| `type`       | `nft.updated` ou `order.updated`                             |
| `version`    | versão do recurso após a mudança (monotônica)                |
| `occurredAt` | data ISO                                                     |
| `resource`   | `{ type, id }` do recurso afetado                            |
| `data`       | estado completo do recurso (não é delta)                     |

**`nft.updated`** — `data`: `price`, `originalPrice`, `available` e `editions[]` (`id`, `price`, `available`). Enviado a todos os clientes.

**`order.updated`** — traz também `userId`; `data`: `status`, `transactionHash`, `explorerUrl`, `declineReason`. Enviado apenas ao dono do pedido.

Regras do cliente: ignora `eventId` repetido, ignora `version` menor ou igual à do cache, descarta eventos de pedido de outro usuário, e após reconectar reconcilia NFTs, carrinho e pedidos pela API REST. Detalhes em [ARCHITECTURE.md](../ARCHITECTURE.md#tempo-real).

### Transporte nos mocks

O servidor do ambiente de mocks é implementado sobre `ws.link` do MSW e fala o subconjunto necessário do protocolo Socket.IO v5 sobre Engine.IO v4 (WebSocket): abertura com `pingInterval`, ping e pong, conexão no namespace `/` com `auth`, eventos e fechamento. O cliente real (`socket.io-client`) conecta normalmente.

Limitações: apenas o namespace `/`; sem salas, `broadcast` entre processos nem recuperação de estado do Socket.IO; sem long-polling (somente WebSocket); eventos perdidos durante uma queda não são reenviados (a reconciliação é feita pela API REST); o servidor vive no navegador, por aba, e o estado é persistido em `localStorage`.
