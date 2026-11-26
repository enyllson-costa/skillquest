# ADR 0004: Quiz com prática de 5 perguntas, sem trilha, unidades e lições

- **Status:** aceito
- **Data:** 2026-11-25

## Contexto
O PRD v0.2 e a ARCHITECTURE v0.3 previam, depois do nivelamento, uma trilha estilo Duolingo: uma unidade por tópico, 3 lições de 6 perguntas por unidade, desbloqueio sequencial, tópicos "testados" e o recálculo da trilha ao refazer o nivelamento (RF-14 a RF-17, ARCHITECTURE §7.1 e §7.2). Isso trazia um módulo inteiro (`path`, com `build.ts`), duas tabelas (`units`, `lessons`), três rotas, um código de erro (`LESSON_LOCKED`) e as regras de estado mais complexas do produto.

O dono do produto decidiu simplificar o fluxo para: escolher a tecnologia → nivelamento adaptativo → prática de 5 perguntas geradas pelo Gemini, que o usuário faz quantas vezes quiser → ao fim de cada prática, um popup "Como foi?" (Fácil / Na medida / Difícil) que ajusta a dificuldade da próxima. Ainda não há código além de `leveling/irt.ts` (probabilidade e fator K) e nenhuma migration aplicada, então a mudança custa só documentação.

## Opções consideradas
1. **Manter a trilha (v0.2):** progressão visível e estrutura de curso, mas é a parte mais cara de construir e testar, e o dono do produto não a quer mais.
2. **Trilha simplificada (só a ordem dos tópicos, sem lições nem desbloqueio):** ainda mantém um modelo de dados e regras de reordenação para um benefício pequeno.
3. **Sem trilha; prática livre de 5 perguntas com ajuste pelo popup:** o nivelamento define a base da dificuldade, o popup ajusta a percepção do usuário prática a prática, e a repetição espaçada, a revisão de erros e a gamificação continuam como estavam.

## Decisão
Opção 3, por decisão do dono do produto.
- **Sai:** RF-14, RF-15, RF-16, RF-17, a "lição do dia" do RF-07 e o RNF-09; as tabelas `units` e `lessons`; o módulo `path` (`path/build.ts`); as rotas `GET /paths/:technologyId`, `POST /lessons/:lessonId/sessions` e `POST /lessons/sessions/:sessionId/answers`; `LESSON_LOCKED`; `kind = lesson` em `study_sessions` (e a coluna `lesson_id`); `context = lesson` em `answers`; `PathDTO` e `LessonResult`; as conquistas `primeira-licao`, `licao-perfeita` e `unidade-concluida`; o `TodayDTO` (revisão separada + lição do dia + reforço).
- **Nivelamento (RF-04):** adaptativo como antes, com **mínimo de 10** (antes 8) e máximo de 20 perguntas; para quando SE < 0,6 a partir da 10ª. Ao concluir, leva à prática (RF-06). Refazer (RF-12) continua com intervalo de 7 dias, sem recálculo de trilha.
- **Prática (RF-07):** 5 perguntas de múltipla escolha, livre (quantas vezes o usuário quiser), com perguntas novas geradas pela IA ou reaproveitadas, mais as revisões vencidas do FSRS. A 1ª sessão terminada no dia cumpre a meta diária. O limite diário de gerações por usuário (RNF-11) continua valendo.
- **Popup (RF-24, novo):** ao fim de cada prática, "Como foi?" com Fácil (aumenta a dificuldade da próxima), Na medida (mantém) e Difícil (diminui).
- **Continuam:** XP, streak, vidas, conquistas, card público, revisão de erros (RF-18), FSRS (ADR 0001), dica (RF-23), modo demo (RF-13), refazer nivelamento (RF-12) e RNF-06.
- **Detalhes:** ver "Decisões tomadas", abaixo.

## Consequências
- **Documentos:** PRD → v0.3 e ARCHITECTURE → v0.4. IDs e numeração de seções foram preservados; o que saiu ficou marcado como removido.
- **api:** o módulo `practice` passa a ter as rotas `POST /practice/sessions`, `POST /practice/sessions/:sessionId/answers` (no lugar de `POST /practice/answers`) e `POST /practice/sessions/:sessionId/feedback`. `GET /practice/today` passa a devolver um resumo (`PracticeSummaryDTO`). A montagem dos 5 slots, a dificuldade-alvo e o offset ficam numa função pura nova, `practice/compose.ts`, no lugar de `path/build.ts` na lista de módulos puros. A prática serve as perguntas uma a uma, com o mecanismo de pré-busca que era da lição (slot 0 na hora, 2 seguintes com `waitUntil`).
- **Banco:** `study_sessions.slots` ganha `source` (`review` / `new`), `study_sessions` ganha `feedback`, e entra a tabela `practice_prefs(user_id, technology_id, difficulty_offset, updated_at)`. Nenhuma migration existe ainda, então nada precisa ser revertido.
- **Contratos:** a resposta da última pergunta do nivelamento perde `pathUrl`; `GET /me/progress` perde `unitsCompleted` e `unitsTotal`; `NO_LIVES` passa a valer também ao iniciar a prática.
- **Custo de IA:** a prática livre pode gastar mais gerações por dia que a trilha. O RNF-11 (100 por usuário por dia), o reuso entre usuários e os slots de revisão (que não chamam a IA) seguram isso.
- **Fora de `docs/` (não editado aqui; para os agentes de implementação):** `eslint.config.mjs` ainda lista `apps/api/src/modules/path/build.ts` em `PURE_MODULES` (trocar por `practice/compose.ts`); as skills `.claude/skills/adaptive-leveling` (parada com mínimo 8, referência à trilha) e `.claude/skills/spaced-repetition` (lição do dia, reforço, "Hoje"); `.claude/rules/testing.md` (E2E "lição completa"); `.claude/rules/angular.md` (estado da lição); o agente `.claude/agents/gamification-designer.md` (trilha de unidades). Os resumos das skills precisam seguir a ARCHITECTURE v0.4.
- **Métricas:** as de lição viraram métricas de prática; as metas novas ficam como "acompanhar" até haver dados.

## Decisões tomadas (aprovadas pelo usuário em 2026-11-25)
1. **Composição:** até 2 revisões vencidas (as mais atrasadas primeiro, servidas antes) + 3 a 5 novas; as vencidas que sobram ficam para as próximas práticas; sem pergunta nova disponível, o slot recebe mais uma vencida.
2. **Popup:** Fácil +1, Na medida 0, Difícil −1, acumulando de −2 a +2 em `practice_prefs` (usuário × tecnologia); dificuldade final com clamp 1–5; não altera θ; volta a 0 ao refazer o nivelamento; `POST /practice/sessions/:sessionId/feedback {rating}` → `{difficultyOffset}`, idempotente, só para sessão terminada.
3. **Conquistas:** `primeira-pratica` (≥ 1 prática terminada), `pratica-perfeita` (5/5) e `pratica-10` (≥ 10 práticas terminadas), no lugar das 3 de lição.
4. **Dificuldade na sessão:** fixa, calculada no início com o θ_tópico e o offset daquele momento.
5. **XP de sessão:** +20 ao terminar a prática (5 respostas), com qualquer número de acertos.
6. **Tópico das novas:** alternam entre os 2 tópicos de menor θ_tópico (sem respostas herda o θ geral; empate pela `position`).
7. **Fechar o popup:** permitido sem responder; equivale a "Na medida" e não grava nada.
8. **Ciclo de vida:** uma prática ativa por tecnologia, retomável; `abandoned` depois de 24h sem resposta (limpeza preguiçosa); iniciar com 0 vidas devolve `NO_LIVES`.
9. **Meta diária:** terminar uma revisão de erros também cumpre a meta diária (como no streak).
