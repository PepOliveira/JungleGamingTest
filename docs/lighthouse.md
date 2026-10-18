# Lighthouse

Metas do desafio: Performance ≥ 90, Acessibilidade ≥ 95, Boas práticas ≥ 95 e SEO ≥ 90, como **mediana de 3 execuções**.

## Como foi medido

`npm run lighthouse` faz o build de produção, sobe `vite preview` e roda o Lighthouse 13 (API de Node, Chromium do Playwright, headless) 3 vezes para cada página e perfil, e grava a mediana em `docs/lighthouse-results.md` e `docs/lighthouse-results.json`.

- Páginas: home (`/`) e detalhe do NFT (`/nfts/nft_001`).
- **Mobile:** configuração padrão do Lighthouse (Moto G Power, 4G simulado de 1,6 Mbps e 150 ms de RTT, CPU 4× mais lenta).
- **Desktop:** 1350×940, 10 Mbps e 40 ms de RTT, sem redução de CPU.
- Medido localmente contra um servidor HTTP/1.1 sem compressão Brotli e sem CDN, com a aplicação rodando em modo `default` dos mocks.

## Ferramentas e ambiente

| Item       | Valor                                                                            |
| ---------- | -------------------------------------------------------------------------------- |
| Lighthouse | 13.5.0 (API de Node)                                                             |
| Navegador  | HeadlessChrome 156 (Chromium do Playwright)                                      |
| Node       | v24.13.1                                                                         |
| Aplicação  | `vite preview` do build de produção, mocks ligados, cenário `default`            |
| Máquina    | Windows 11 (x64), AMD Ryzen 5 5600X (12 threads), 16 GB                          |
| Servidor   | HTTP/1.1 local, sem Brotli e sem CDN                                             |
| Execuções  | 3 por página e perfil; o valor reportado é a mediana por categoria e por métrica |

Os mesmos dados, com data da execução, estão em `docs/lighthouse-results.json` (`meta`).

## Relatórios completos

- Tabela e metadados: [`lighthouse-results.md`](lighthouse-results.md) e [`lighthouse-results.json`](lighthouse-results.json).
- Relatório HTML e JSON de **cada execução**, em [`docs/lighthouse/`](lighthouse/), nomeados `<página>-<perfil>-run<n>` (por exemplo `home-mobile-run2.html`).
- Para reproduzir: `npm run lighthouse` (leva alguns minutos).

## Resultados (mediana de 3 execuções)

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO | LCP     | CLS   | TBT    |
| ------- | ------- | ----------- | -------------- | ------------- | --- | ------- | ----- | ------ |
| home    | desktop | 96          | 98             | 100           | 100 | 1248 ms | 0.020 | 0 ms   |
| detalhe | desktop | 96          | 100            | 100           | 100 | 1232 ms | 0.000 | 0 ms   |
| home    | mobile  | **71**      | 100            | 100           | 100 | 5211 ms | 0.019 | 128 ms |
| detalhe | mobile  | **74**      | 100            | 100           | 100 | 4899 ms | 0.000 | 110 ms |

**Desktop atende às quatro metas. No mobile, Acessibilidade, Boas práticas e SEO atendem; Performance fica abaixo de 90** (71 e 74). CLS e TBT estão excelentes nos dois perfis; o que reprova o mobile é o LCP.

## Ambiente publicado (Vercel)

Medição feita na URL publicada, https://jungle-gaming-test-gamma.vercel.app, com CDN, HTTP/2 e Brotli, mesma configuração de perfis e 3 execuções por página e perfil (mediana). Relatórios completos em [`lighthouse-deployed/`](lighthouse-deployed/), tabela e metadados em [`lighthouse-deployed-results.md`](lighthouse-deployed-results.md) e [`lighthouse-deployed-results.json`](lighthouse-deployed-results.json).

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO | LCP     | CLS   | TBT   |
| ------- | ------- | ----------- | -------------- | ------------- | --- | ------- | ----- | ----- |
| home    | desktop | 100         | 98             | 100           | 100 | 616 ms  | 0.020 | 0 ms  |
| detalhe | desktop | 100         | 100            | 100           | 100 | 630 ms  | 0.000 | 0 ms  |
| home    | mobile  | **87**      | 100            | 100           | 100 | 3275 ms | 0.019 | 0 ms  |
| detalhe | mobile  | **88**      | 100            | 100           | 100 | 3243 ms | 0.000 | 13 ms |

**No ambiente publicado o desktop atende às quatro metas com folga (Performance 100). No mobile, Acessibilidade, Boas práticas e SEO atendem; Performance fica em 87 e 88, a poucos pontos da meta de 90.** O que separa o mobile da meta é o LCP (~3,2 s), pelo motivo descrito a seguir. A medição local (tabela anterior) tem números menores porque o servidor local não tem CDN nem HTTP/2.

## Por que o mobile não chega a 90

A causa é estrutural e não um defeito de renderização. Como não há backend, o app só consegue buscar dados depois de:

1. baixar e executar o bundle principal (≈ 344 KB, 110 KB gzip);
2. baixar o runtime dos mocks (MSW com banco e fixtures, ≈ 146 KB gzip) e registrar o service worker;
3. responder à API simulada;
4. só então baixar e pintar a imagem do hero (o elemento de LCP).

Sob 4G simulado e CPU 4× mais lenta, esses passos em série somam ~5 s até o LCP no servidor local e ~3,2 s na versão publicada (com CDN e HTTP/2). Num backend real, os passos 2 e 3 não existiriam: o app consultaria a API diretamente. O desktop, sem a limitação de rede e de CPU, termina esse mesmo caminho em ~1,2 s.

## O que já foi feito para melhorar

| Mudança                                                                                       | Efeito                                                                     |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Código dos mocks (MSW, banco, hashes) fora do bundle principal, como entrada paralela         | bundle principal de 756 KB para 344 KB                                     |
| App renderiza de imediato; requisições e socket aguardam os mocks                             | o shell não espera o MSW para aparecer                                     |
| Diálogo de login e cadastro (React Hook Form) carregado sob demanda                           | −45 KB no bundle principal                                                 |
| Skeletons de detalhe e carrinho com a altura do conteúdo final                                | CLS do detalhe de 0,202 para 0,000                                         |
| Imagem principal sem animação de entrada e com `fetchpriority="high"`                         | menos atraso entre carregar e pintar                                       |
| Chunks do runtime dos mocks pré-carregados pelo HTML (`modulepreload`), em paralelo com o app | remove um salto de rede em série; mobile publicado de 85 e 88 para 87 e 88 |
| `srcset` limitado a 640 px nos slots pequenos                                                 | menos bytes concorrendo com a imagem de LCP                                |
| `meta description`, `robots.txt`, favicon e `theme-color`                                     | SEO de 83 para 100                                                         |
| Token `--destructive` mais claro                                                              | contraste ≥ 4,5:1 (axe sem violações)                                      |

## Próximos passos possíveis

- Medir contra a URL publicada: CDN, HTTP/2 e Brotli reduzem transferência e latência de requisições, o que deve melhorar o mobile em relação a esta medição local.
- Para chegar a 90 no mobile com mocks, seria preciso tirar o MSW do caminho crítico do primeiro render (por exemplo, dados iniciais do hero embutidos no HTML), ao custo de acoplar a página inicial aos fixtures.
- Com um backend real, o runtime dos mocks deixa de ser baixado (`VITE_ENABLE_MOCKS=false`) e o caminho crítico encurta.
