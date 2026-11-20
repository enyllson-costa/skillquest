---
paths:
  - "apps/web/**/*.tsx"
  - "apps/web/**/*.ts"
---

# Regras React (apps/web)
- React 19: use `use()`, Actions e `useOptimistic` para respostas do quiz.
- Animações de troca de questão com View Transitions (`<ViewTransition>`).
- Acessibilidade: toda opção de resposta é um <button> com foco visível e
  navegação por teclado (1-4 e Enter).
- Estado do servidor: TanStack Query. Estado da lição: store Zustand por lição.
- Componentes em PascalCase, um por arquivo, com teste ao lado (Componente.test.tsx).
- Estilo com Tailwind + componentes do shadcn/ui; nada de CSS inline.
- Tipos e schemas vêm de packages/shared; nunca duplique tipos no front.