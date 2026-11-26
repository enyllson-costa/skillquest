# ADR 0003: Harness de validação para agentes

- **Status:** aceito
- **Data:** 2026-11-25

## Contexto
O projeto é implementado em grande parte por agentes de IA (`.claude/agents/`). Até aqui, o critério de pronto de cada agente era só texto ("rode typecheck e os testes"), e várias regras da arquitetura (Gemini só em `modules/ai`, RLS em toda tabela, módulos puros sem relógio, teste ao lado do código) existiam apenas na documentação. Um agente não tinha como verificar sozinho se terminou, nem era impedido de mexer em arquivos sensíveis.

## Opções consideradas
1. **Só instruções em texto (como estava):** zero custo, mas nada garante o cumprimento.
2. **Ferramentas especializadas para cada coisa:** dependency-cruiser para camadas, husky para git hooks, gitleaks para segredos. São mais completas, mas trazem mais dependências e mais configuração para manter.
3. **Um gate único, com ferramentas que o projeto já planejava:** ESLint (com as regras de camada em `no-restricted-imports` e `no-restricted-syntax`), Prettier, `tsc`, Vitest e MSW, mais dois scripts Node pequenos (`check-arch`, `check-bundle`), `simple-git-hooks`, `lint-staged` e commitlint. Tudo é chamado por um só comando (`pnpm verify` e `pnpm verify:fast`), usado por hooks do Claude Code, agentes, `/ship` e CI.

## Decisão
Opção 3, em quatro camadas:
- **L0, guardrails** (hook PreToolUse `protect-files.sh` + `permissions.deny`): bloqueiam `.env*`, o lockfile, migrations existentes, a própria config, push forçado e pular git hooks.
- **L1, feedback por arquivo** (hook PostToolUse `format-and-lint.sh`): roda Prettier + ESLint no arquivo editado e devolve o erro ao agente na hora.
- **L2, gate de fim de turno** (hooks Stop/SubagentStop `typecheck-on-stop.sh`): roda `pnpm verify:fast` nos pacotes afetados; se falhar, o agente não encerra (até 3 tentativas).
- **L3, gate completo** (`pnpm verify`, git hooks, CI): formatação, lint, typecheck, `check:arch`, testes, build e `check:bundle`. O resultado vai para `.harness/last-verify.json`, que os revisores leem.

O Definition of Done fica no CLAUDE.md, com 4 critérios objetivos.

## Consequências
- **Dependências novas (devDependencies da raiz):** typescript, eslint, @eslint/js, typescript-eslint, globals, prettier, vitest, msw, @commitlint/cli, @commitlint/config-conventional, simple-git-hooks, lint-staged, @types/node.
- **TypeScript fixado em `~6.0`**, porque o typescript-eslint 8.74 ainda não suporta o TypeScript 7. Revisar quando houver suporte.
- **MSW 3:** a opção para bloquear requisições sem handler é `onUnhandledFrame: 'error'`; o nome antigo era `onUnhandledRequest`.
- **As regras por texto do `check-arch` são heurísticas** (grep/regex). Cada regra tem testes com um caso que viola e um que passa, em `scripts/harness/check-arch.test.mjs`, e a mensagem de erro cita a fonte.
- **O guardrail de Bash também é heurístico:** pode dar falso positivo (bloqueia um comando que só cita "git push --force" num texto) e pode ser contornado. A proteção real do lockfile é o `--frozen-lockfile` no CI.
- **Partes do harness ficam para o scaffold do web:** angular-eslint, Playwright + axe, e o `check:bundle` sobre um build real. As regras de caminho do ESLint para `apps/web` já existem.
- **O que não é automatizável continua com os revisores:** o filtro por `user_id` nos repos e a qualidade dos testes.
