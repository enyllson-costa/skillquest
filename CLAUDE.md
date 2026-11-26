# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## SkillQuest

App web que nivela o conhecimento do usuário numa tecnologia com um quiz adaptativo
de múltipla escolha gerado por IA e depois oferece prática diária estilo Duolingo
(XP, streak, vidas, repetição espaçada). Projeto de estudo/portfólio com meta de custo US$0.

Leia @docs/PRD.md e @docs/ARCHITECTURE.md antes de mudanças estruturais.

## Stack (planejado)
- Monorepo pnpm:
  - apps/web: Angular (última estável; confirme ao instalar) + TypeScript strict + Tailwind +
    Angular CDK (componentes próprios, sem Material/shadcn); estado com signals e `httpResource`.
    Ver docs/ADR/0002-angular-em-vez-de-react.md
  - apps/api: Hono em Node 24, única camada que chama a IA (Google Gemini API, REST v1beta,
    plano gratuito; modelo via env `GEMINI_MODEL`, atrás da interface `QuestionGenerator`)
  - packages/shared: schemas Zod e tipos compartilhados
- Supabase para auth e banco (Postgres + RLS)
- Deploy na Vercel (plano Hobby): apps/web estático + apps/api como Vercel Functions (Node).
  A api é stateless: nada de estado em memória; trabalho após a resposta só com `waitUntil`.
- Testes: Vitest + Angular Testing Library (unidade/componente, arquivos `*.test.ts`),
  Playwright (E2E, `e2e/*.spec.ts`), MSW para mockar a IA

## Comandos (planejado)
- pnpm dev        # web + api
- pnpm test       # vitest em todo o monorepo
- pnpm e2e        # playwright
- pnpm typecheck
- pnpm lint

## Convenções
- TypeScript strict, sem `any`.
- Front: componentes standalone com signals (`input()`, `output()`, `computed`), `OnPush` e `inject()`;
  zoneless; control flow `@if`/`@for`; sem NgModules.
- Chave do Gemini só em apps/api (.env); nunca no front, nunca no git.
- Testes nunca chamam o Gemini real: use `AI_PROVIDER=mock` / MSW.
- Toda resposta da IA é validada com Zod antes de chegar ao usuário.
- Commits em Conventional Commits (feat:, fix:, chore:, docs:, test:).
- Toda feature nova tem teste.
- Nunca edite .env*, lockfiles à mão ou migrations já aplicadas.

## Fluxo de trabalho
- Mudanças grandes: planejar antes (Plan Mode) e registrar um ADR em docs/ADR/.
- Delegar (planejado: esses subagents ainda não existem em .claude/agents/; até lá,
  faça o trabalho direto): UI -> frontend-dev, API/banco -> backend-dev, prompts de IA ->
  ai-prompt-engineer, testes -> test-engineer. Revisar com code-reviewer no fim.