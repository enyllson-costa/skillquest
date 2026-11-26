# ADR 0002: Angular em vez de React no apps/web

- **Status:** aceito
- **Data:** 2026-11-25

## Contexto
A v0.2 planejava o `apps/web` em React 19 + Vite 8 + shadcn/ui, com TanStack Query para os dados da api e Zustand para o estado da lição. Nenhum código do front existia ainda. O projeto é de estudo e portfólio, e o autor vai trabalhar com Angular (incluindo Angular Material) em breve, então quer praticar Angular aqui. Ao mesmo tempo, prefere ter estilo próprio a depender de uma biblioteca visual.

O Angular 20 foi considerado, mas o suporte LTS dele termina por volta de novembro de 2026. Por isso, o projeto usa a **última versão estável** do Angular disponível ao instalar.

## Opções consideradas
1. **Manter React:** desenho já pronto, mas não atende ao objetivo de estudar Angular.
2. **Angular + Angular Material:** componentes prontos e o mesmo ecossistema do trabalho, mas o visual fica preso ao Material e o Tailwind fica em segundo plano.
3. **Angular + Spartan UI:** o equivalente do shadcn no Angular. Menos maduro, e acrescenta mais uma camada (brain/helm, CLI própria) para aprender.
4. **Angular + Angular CDK + Tailwind:** o CDK dá as primitivas de comportamento e acessibilidade (foco, teclado, ARIA, Dialog, Overlay, Listbox, `LiveAnnouncer`), sem CSS. O estilo é próprio, com Tailwind. O Material é construído sobre o CDK, então o aprendizado se aproveita no trabalho.

Para o estado, também foram consideradas três opções: signals nativos (`httpResource`/`resource`), `@tanstack/angular-query` (ainda marcado como experimental) e NgRx SignalStore (mais estrutura do que o MVP precisa).

## Decisão
Opção 4, com signals nativos.
- **Framework:** Angular (última estável), com Angular CLI (builder `@angular/build:application`, esbuild), TypeScript strict, componentes standalone, zoneless, `ChangeDetectionStrategy.OnPush`, `inject()`, `input()`/`output()`/`model()` e control flow `@if`/`@for`/`@switch`.
- **Rotas:** Angular Router com `loadComponent` (lazy), guards funcionais e `withViewTransitions()`.
- **UI:** Tailwind + Angular CDK; componentes próprios em `src/app/shared/ui/`. Sem shadcn, Spartan ou Material.
- **Dados da api:** `httpResource` para leituras e `HttpClient` para mutações, com um interceptor funcional que injeta o Bearer do Supabase.
- **Estado da lição:** um serviço com signals por lição, provido na rota da lição (no lugar do Zustand).
- **Testes:** Vitest pelo builder `@angular/build:unit-test`, com `@testing-library/angular` e `@testing-library/user-event`. Os arquivos se chamam `*.test.ts`, porque `*.spec.ts` está reservado para o E2E (Playwright, em `e2e/`).

## Consequências
- Nada muda em `apps/api`, `packages/shared`, Supabase ou na Vercel, além da saída do build do web (`dist/web/browser`) e do proxy de dev (`proxy.conf.json` do `ng serve`, no lugar do proxy do Vite).
- Os componentes visuais (botão, card, barra de progresso, diálogo) são escritos à mão. Dá mais trabalho, mas é parte do estudo.
- Configuração pública do front (`supabaseUrl`, `supabaseAnonKey`) entra no build (opção `define` do `angular.json` ou arquivos `environments/`). Confirme ao instalar.
- A regra `.claude/rules/react.md` virou `.claude/rules/angular.md`, e a skill `react-component` virou `angular-component`.
- Confirme ao instalar: a versão estável do Angular, se `httpResource` já saiu de experimental, e as opções do builder `unit-test` (`include` com `*.test.ts`).
