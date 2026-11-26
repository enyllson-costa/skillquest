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

## Comandos
- pnpm verify:fast  # gate durante o trabalho: format, lint, typecheck e testes do que mudou + check:arch
- pnpm verify       # gate completo antes do commit: format:check, lint, typecheck, check:arch, test, build, check:bundle
- pnpm test         # vitest em todo o monorepo + testes do harness (test:harness)
- pnpm typecheck
- pnpm lint         # eslint, incluindo as regras de camada da ARCHITECTURE §0
- pnpm format       # prettier --write
- pnpm check:arch   # regras de arquitetura e de processo (scripts/harness/check-arch.mjs)
- pnpm dev, pnpm e2e  # planejados: entram com o scaffold do web/api

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

## Harness e Definition of Done
- Hooks em .claude/settings.json: `protect-files.sh` bloqueia edição de .env*, lockfile,
  migrations já existentes e da própria config; `format-and-lint.sh` formata e faz lint de
  cada arquivo editado; `typecheck-on-stop.sh` roda `pnpm verify:fast` antes de o agente
  encerrar (até 3 tentativas). Não contorne os hooks; corrija o que eles apontam.
- `pnpm verify:fast` (pacotes afetados) durante o trabalho; `pnpm verify` (tudo, inclusive
  build e check:arch) antes do commit. Resultado em `.harness/last-verify.json`.
- Pronto significa:
  1. `pnpm verify` com exit 0;
  2. se tocou UI, `pnpm e2e` do fluxo verde, sem violação axe serious/critical;
  3. cada critério de aceite do plano marcado `- [x] CA-n → arquivo.test.ts`;
  4. code-reviewer sem BLOQUEANTE e, se tocou auth/banco/rotas/IA, security-auditor sem CRÍTICA/ALTA.

## Fluxo de trabalho
- Mudanças grandes: planejar antes (Plan Mode) e registrar um ADR em docs/ADR/.
- Delegar aos subagents de .claude/agents/: planos e ADRs -> architect, UI -> frontend-dev,
  API/banco/packages/shared -> backend-dev, prompts de IA -> ai-prompt-engineer, regras de
  gamificação -> gamification-designer, testes -> test-engineer. Revisar com code-reviewer
  (mais security-auditor e ux-a11y-reviewer conforme a área); o /feature orquestra o ciclo.