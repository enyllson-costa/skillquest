---
name: feature
description: Orquestra o ciclo completo de uma feature do SkillQuest com os subagentes - planejar, implementar, testar e revisar.
argument-hint: <descrição da feature>
disable-model-invocation: true
---
Feature pedida: $ARGUMENTS

Você é o orquestrador. Não implemente nada você mesmo: delegue cada etapa ao subagente indicado e passe para ele o contexto necessário (caminho do plano, arquivos relevantes, critérios de aceite). Siga as etapas na ordem, sem pular nenhuma.

## 1. Planejar
- Delegue ao `architect`: criar docs/plans/<slug>.md a partir de docs/PRD.md e docs/ARCHITECTURE.md.
- Se a feature envolver XP, streak, vidas, ligas ou trilha, consulte antes o `gamification-designer`.
- Mostre o plano resumido (objetivo, tarefas por agente, critérios de aceite) e PARE. Espere eu aprovar ou pedir mudanças.

## 2. Implementar
Depois da aprovação, nesta ordem (contratos primeiro):
1. `backend-dev`: schemas em packages/shared, rotas e migrations.
2. `ai-prompt-engineer`: se o plano tiver tarefas de IA (prompts, evals).
3. `frontend-dev`: telas e componentes usando os contratos já criados.

Por padrão, rode um agente por vez para economizar cota. Só rode em paralelo se eu escrever "paralelo" junto da feature.
Gate entre agentes: só passe para o próximo quando o anterior entregar `pnpm verify:fast` verde. Se vier vermelho, devolva ao mesmo agente com a saída do erro.

## 3. Testar
- Delegue ao `test-engineer`: testes para cada critério de aceite, marcados no plano como `- [x] CA-n → arquivo.test.ts`, e `pnpm verify:fast` (mais `pnpm e2e` se houver UI).
- Se ele reportar bug no código, devolva ao agente dono da área com a descrição exata. No máximo 3 voltas; depois disso, pare e me explique o impasse.

## 4. Revisar
- Delegue ao `code-reviewer`. Se a feature mexer em auth, banco, rotas ou IA, chame também o `security-auditor`. Se mexer em UI, chame o `ux-a11y-reviewer`.
- Todo achado BLOQUEANTE, CRÍTICO ou ALTO volta para o agente dono, e a revisão é refeita.

## 5. Entregar
Resuma em até 15 linhas:
- O que foi feito e arquivos principais alterados.
- Resultado de `pnpm verify` (exit code e etapa que falhou, se falhou) e do E2E, se houver UI.
- Definition of Done (CLAUDE.md): quais itens estão cumpridos e quais não.
- Achados de revisão que ficaram pendentes (não bloqueantes).
- Mensagem de commit sugerida em Conventional Commits.
Não faça commit: isso é papel do /ship.
