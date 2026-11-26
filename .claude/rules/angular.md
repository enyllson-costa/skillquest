---
paths:
  - "apps/web/**/*.ts"
  - "apps/web/**/*.html"
---

# Regras Angular (apps/web)
- Angular na última estável (ADR 0002): componentes **standalone**, `ChangeDetectionStrategy.OnPush`,
  app **zoneless** (`provideZonelessChangeDetection`). Sem NgModules.
- Entradas e saídas com `input()` / `input.required()` / `output()` / `model()`, não com `@Input`/`@Output`.
  Dependências com `inject()`, não pelo construtor.
- Templates com control flow `@if` / `@for (...; track item.id)` / `@switch`; nada de `*ngIf`/`*ngFor`.
- Estado do servidor: `httpResource` (ou `resource`) para leituras, `HttpClient` para mutações, encapsulados
  num serviço da feature. O Bearer do Supabase entra por um interceptor funcional, nunca à mão.
- Estado da sessão (nivelamento, prática, revisão de erros): um serviço com signals (`signal`, `computed`)
  por sessão, provido na rota da sessão (`providers` da rota), no lugar de store global.
- O popup "Como foi?" usa `@angular/cdk/dialog` (foco preso e devolvido, Esc fecha = "Na medida").
- Resposta do quiz: atualize o signal de forma otimista ao clicar (opção marcada, botões desativados) e
  aplique o `feedback` da api quando chegar; reverta em caso de erro.
- Troca de pergunta animada com View Transitions (`withViewTransitions()` no router ou
  `document.startViewTransition`), respeitando `prefers-reduced-motion`.
- Acessibilidade: toda opção de resposta é um `<button>` com foco visível e navegação por teclado
  (1-4 e Enter, via `host: { '(document:keydown)': ... }`). Feedback de acerto/erro anunciado com o
  `LiveAnnouncer` do `@angular/cdk/a11y`; diálogos com `@angular/cdk/dialog` (foco preso e devolvido).
- UI: componentes próprios em `src/app/shared/ui/` com Tailwind + Angular CDK. Sem Angular Material,
  shadcn ou Spartan; nada de CSS inline (`style="..."`).
- Arquivos em kebab-case (`answer-option.component.ts` + `.html`), classe em PascalCase com sufixo
  `Component`, teste ao lado como `*.test.ts`.
- Rotas lazy com `loadComponent`; rotas logadas protegidas por um `authGuard` funcional; `/c/:slug` fica fora dele.
- Tipos e schemas vêm de packages/shared; nunca duplique tipos no front.
