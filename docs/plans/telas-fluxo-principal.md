# Plano: telas do fluxo principal (rodada 1)

**Objetivo:** entregar, em `apps/web` (Angular), o fluxo principal: login → catálogo → nivelamento → resultado → prática de 5 → popup "Como foi?" → resultado da prática. As telas rodam contra mocks MSW no navegador, antes da api real.

**Fontes:**
- ARCHITECTURE v0.4: §2 (entrada livre), §3.3 (`question_reports`), §4 (contratos, `reportedByMe`), §4.6 (erros), §4.7 (dica), §5 (retomar, cooldown e refazer em andamento), §6 (parada), §7.3 (prática e popup), §7.6 (vidas).
- PRD v0.3: RF-01, RF-02, RF-04 a RF-07, RF-10, RF-12, RF-13, RF-23, RF-24, RF-25, RNF-04, RNF-08.
- [ADR 0002](../ADR/0002-angular-em-vez-de-react.md): Angular, CDK + Tailwind, signals, testes `*.test.ts`.
- [ADR 0005](../ADR/0005-msw-no-browser.md): MSW no navegador, `AuthService`, modo demo.
- [ADR 0003](../ADR/0003-harness-de-validacao.md): harness.

## Escopo

**Telas da rodada 1:**

| Tela | Rota (web) | Guard | Resumo |
|---|---|---|---|
| Shell | layout das rotas logadas | `authGuard` | cabeçalho com vidas (e tempo até a próxima), XP total e streak; navegação (Catálogo; Sair) |
| Login | `/login` | sem guard (logado → redireciona ao catálogo) | magic link (campo de e-mail), "Entrar com GitHub" e "Entrar no modo demo" |
| Catálogo | `/` | `authGuard` | "Minhas tecnologias" e a busca; detalhes abaixo da tabela |
| Nivelamento | `/t/:technologyId/nivelamento` | `authGuard` | 10 a 20 perguntas, uma por vez, sem dica, com "Reportar pergunta"; progresso "Pergunta n" (o `total` 20 é só o máximo); feedback e explicação depois de cada resposta; com nivelamento ativo, retoma na pergunta atual |
| Resultado do nivelamento | `/t/:technologyId/resultado` | `authGuard` | nível geral **por nome** (sem θ numérico), tópicos com forte/fraco/neutro por texto, conquistas novas, CTA "Praticar" |
| Prática | `/t/:technologyId/pratica` | `authGuard` | 5 perguntas, cada uma com o tópico e o selo "Revisão" quando `source = review`; vidas, dica, "Reportar pergunta", feedback por pergunta; `NO_LIVES` com contagem regressiva; botão secundário de nivelamento (detalhes abaixo da tabela) |
| Popup "Como foi?" | diálogo dentro da prática | — | `Dialog` do CDK com Fácil / Na medida / Difícil; Esc ou "fechar" = Na medida, sem chamar a api |
| Resultado da prática | estado final da rota `/t/:technologyId/pratica` | `authGuard` | depois do popup (respondido ou fechado): acertos, XP ganho, streak, conquistas novas; botões "Praticar de novo" e "Voltar ao catálogo" |

**Catálogo:**
- **"Minhas tecnologias"** fica acima do campo de busca, vem de `GET /me/progress` e é ordenada por `lastActivityAt` decrescente (a usada mais recentemente primeiro). Cada item:
  - nivelada, sem nivelamento em andamento: nome + nível; o clique abre a prática;
  - nivelada, com um novo nivelamento `active`: nome + nível atual (do último concluído); o clique principal abre a prática, e o botão secundário "Continuar nivelamento" retoma a sessão;
  - só com nivelamento `active` (nenhum concluído): nome + rótulo "Nivelamento em andamento" + botão "Continuar", que retoma a sessão.
- **Busca** "Qual tecnologia?": até 40 caracteres, charset `[a-z0-9 .+#-]` depois de `trim` + minúsculas (§2). O resultado segue a mesma regra da lista: nivelada → prática; só em andamento → retoma o nivelamento; nova → tópicos + CTA "Começar nivelamento".

**Botão secundário de nivelamento na prática:**
- com nivelamento `active` da tecnologia: "Continuar nivelamento", habilitado;
- sem nivelamento ativo, com `placementAvailableAt` no futuro: "Refazer nivelamento" já abre **desabilitado**, com "Disponível em N dias" ou "Disponível em N horas";
- sem nivelamento ativo e com `placementAvailableAt = null`: "Refazer nivelamento", habilitado.

**Fora da rodada 1:** revisão de erros, painel de progresso, conquistas (tela), cards, `/c/:slug`, retomar a sessão depois de recarregar a página (os mocks perdem o estado ao recarregar, ADR 0005) e a api real (rotas, banco, Supabase, Gemini), incluindo o usuário demo no Supabase (ADR 0005).

## Componente central: `QuestionPlayer`

`apps/web/src/app/shared/question-player/question-player.component.ts`, reaproveitado no nivelamento e na prática (e depois na revisão de erros).

- **Entradas:** `question: QuestionDTO | PracticeQuestionDTO`, `feedback: AnswerFeedback | null`, `disabledIndexes: number[]` (alternativa eliminada pela dica), `busy: boolean`, `hintAvailable: boolean` (falso no nivelamento), `hintUsed: boolean`.
- **Saídas:** `answer(chosenIndex)`, `hint()`, `next()`, `report({ reason, details? })`.
- **Comportamento:**
  - mostra o tópico da pergunta (`question.topic.name`) e, quando `source === "review"`, o selo "Revisão" (texto, não só ícone);
  - enunciado como título da pergunta; 4 opções como `radiogroup` com rótulo (`Listbox` do CDK ou `input type=radio` nativo);
  - atalhos de teclado: 1 a 4 escolhem a opção, Enter confirma; depois do feedback, Enter vai para a próxima;
  - feedback (acertou/errou, alternativa correta e explicação) anunciado com o `LiveAnnouncer` do CDK e mostrado por texto e ícone, não só por cor;
  - foco vai para o feedback depois de responder, e para o enunciado quando chega a próxima pergunta;
  - a alternativa eliminada pela dica fica desabilitada, com o texto "eliminada pela dica".
- **Report:**
  - com `question.reportedByMe === true`, o link "Reportar pergunta" vira "Reportada ✓", desabilitado;
  - senão, "Reportar pergunta" abre um diálogo do CDK com um grupo de `radio` **obrigatório** ("Resposta errada", "Ambígua", "Mais de uma correta", "Outro"; valores `resposta_errada`, `ambigua`, `mais_de_uma_correta`, `outro`) e um campo opcional de detalhes (no máximo 280 caracteres, com contador);
  - "Enviar" fica desabilitado até um motivo ser escolhido. Com o `204`, o diálogo mostra "Obrigado, vamos revisar", o link passa na hora a "Reportada ✓" e o andamento da sessão não muda.
- O componente não sabe nada de HTTP: quem chama a api é o serviço de sessão da tela (signals, provido na rota, ADR 0002).

## Contratos

Tudo vem da ARCHITECTURE v0.4 §4, já com os ajustes deste plano:
- `QuestionDTO` com `reportedByMe`;
- `PracticeQuestionDTO` com `source`;
- retomar nivelamento;
- `PLACEMENT_COOLDOWN` com `retryAfterSeconds`;
- `placementAvailableAt`;
- `MeProgressResponse` com `placementInProgress` e `lastActivityAt`, já ordenado;
- report com motivo fixo, idempotente e mantendo o 1º motivo.

O backend-dev cria os schemas em `packages/shared`, e a web e os mocks só os importam.

| Tela | Rotas (§4) | Tipos |
|---|---|---|
| Shell | `GET /me/progress` (`xpTotal`, `streak`, `lives`, `livesRefillAt`) | `MeProgressResponse` |
| Login | nenhuma (Supabase Auth ou demo) | — |
| Catálogo | `GET /me/progress` (`technologies[]`: `id`, `name`, `level`, `placementInProgress`, `lastActivityAt`, já em ordem), `POST /technologies/resolve` | `MeProgressResponse`, `ResolveTechnologyRequest/Response` |
| Nivelamento | `POST /placement/sessions` (cria ou retoma), `POST /placement/sessions/:id/answers`, `POST /questions/:id/report`; erros `PLACEMENT_COOLDOWN` (com `retryAfterSeconds`), `SESSION_FINISHED`, `NOT_FOUND`, `AI_*`, `RATE_LIMITED` | `StartPlacementRequest/Response`, `PlacementAnswerRequest/Response`, `QuestionDTO` (com `reportedByMe`), `AnswerFeedback`, `Progress`, `PlacementResult`, `AchievementDTO`, `ReportQuestionRequest` |
| Resultado do nivelamento | nenhuma nova (usa o `PlacementResult` e os `newAchievements` da última resposta, guardados no serviço da sessão; o campo `theta` não é exibido) | `PlacementResult`, `Level`, `AchievementDTO` |
| Prática | `GET /practice/today` (inclui `placementAvailableAt`), `GET /me/progress` (para `placementInProgress` da tecnologia), `POST /practice/sessions`, `POST /practice/sessions/:sessionId/answers`, `POST /study-sessions/:sessionId/hint`, `POST /questions/:id/report`, `POST /placement/sessions` (botão secundário habilitado); erros `PLACEMENT_REQUIRED`, `PLACEMENT_COOLDOWN`, `NO_LIVES` (com `retryAfterSeconds`), `SESSION_FINISHED`, `VALIDATION_ERROR`, `AI_*`, `RATE_LIMITED` | `PracticeSummaryDTO`, `StartPracticeRequest/Response`, `PracticeQuestionDTO`, `PracticeAnswerRequest/Response`, `PracticeResult`, `HintRequest/Response`, `ReportQuestionRequest` |
| Popup | `POST /practice/sessions/:sessionId/feedback` | `PracticeFeedbackRequest` (`.strict()`), `PracticeFeedbackResponse` |
| Resultado da prática | `GET /me/progress` recarregado, para o streak atualizado; o resto vem do `PracticeResult` e dos `newAchievements` da 5ª resposta | `PracticeResult`, `AchievementDTO`, `MeProgressResponse` |
| Todas | formato de erro da §4.6 | `ErrorCode`, `ErrorResponseSchema` |

**Botão "Refazer nivelamento":**
- o estado vem de `PracticeSummaryDTO.placementAvailableAt` e o texto, de `formatAvailability(placementAvailableAt, now)`:
  - faltando ≥ 1 dia: "Disponível em N dias" (N arredondado para cima; "1 dia" no singular);
  - faltando < 1 dia: "Disponível em N horas" (arredondado para cima; "1 hora" no singular);
- se o `POST` ainda devolver `PLACEMENT_COOLDOWN`, a tela usa o `retryAfterSeconds` com a mesma formatação.

**Schemas que o backend-dev cria em `packages/shared/src/`:**
- `errors.ts`: enum `ErrorCode` (os 12 códigos da §4.6, sem `LESSON_LOCKED`), mapa código → HTTP, `ErrorResponseSchema` (`{ error: { code, message, retryAfterSeconds? } }`).
- `constants.ts`, com os valores da §4, da §6 e da §7.3:
  - entrada: `TECH_INPUT_MAX = 40`, `TECH_INPUT_PATTERN`;
  - nivelamento: `PLACEMENT_MIN_QUESTIONS = 10`, `PLACEMENT_MAX_QUESTIONS = 20`, `PLACEMENT_SE_STOP`, `PLACEMENT_COOLDOWN_DAYS = 7`;
  - prática: `PRACTICE_SIZE = 5`, `PRACTICE_MAX_DUE`, `DIFFICULTY_OFFSET_MIN/MAX`;
  - vidas: `LIVES_MAX = 5`, `LIFE_REGEN_HOURS = 4`;
  - report: `REPORT_DETAILS_MAX = 280`, `REPORT_REASONS`.
- `schemas/common.ts`: `LevelSchema`, `QuestionDTOSchema` (`.strict()`, com `reportedByMe: boolean`, sem `correctIndex` nem `explanation`), `PracticeQuestionDTOSchema` (`QuestionDTOSchema.extend({ source: z.enum(["review", "new"]) }).strict()`), `AnswerFeedbackSchema`, `ProgressSchema`, `AnswerRequestSchema` (`{ questionId, chosenIndex: 0..3 }`).
- `schemas/catalog.ts`: `TechnologyInputSchema` (normaliza com `trim` + minúsculas, depois valida tamanho e charset), `ResolveTechnologyRequest/ResponseSchema`.
- `schemas/placement.ts`: `StartPlacement…` (`progress.answered` ≥ 0, para a retomada), `PlacementAnswerResponseSchema` (união `next: { question } | { result }`), `PlacementResultSchema`.
- `schemas/practice.ts`: `PracticeSummaryDTOSchema` (com `placementAvailableAt: string datetime | null`), `StartPractice…` e `PracticeAnswerResponseSchema` (com `PracticeQuestionDTO`), `PracticeResultSchema`, `PracticeFeedbackRequest/ResponseSchema`, `HintRequest/ResponseSchema`.
- `schemas/questions.ts`: `ReportQuestionRequestSchema` (`{ reason: enum dos 4 motivos, details?: string trim ≤ 280 }`, `.strict()`).
- `schemas/achievements.ts`: `AchievementDTOSchema`.
- `schemas/progress.ts`: `MeProgressResponseSchema`. Cada tecnologia tem `level: Level | null`, `theta: number | null`, `placementInProgress: boolean`, `lastActivityAt: string datetime` e `topics` (vazio sem nivelamento concluído).
- `schemas/fixtures.ts`: `QuestionFixtureSchema` (`id`, `topicSlug`, `stem`, 4 `options`, `correctIndex`, `explanation`, `difficulty` 1–5) e `TechnologyFixtureSchema`. Ficam fora do `index.ts` público, num subpath `@skillquest/shared/fixtures`, porque têm a resposta correta (ver Riscos).

## Fixtures

Uma tecnologia, **TypeScript** (slug `typescript`, aliases `ts`), com 5 tópicos: `tipos-basicos`, `funcoes`, `interfaces-e-tipos`, `generics` e `narrowing`. Arquivo: `apps/api/fixtures/typescript.json` (fonte única, ADR 0005).

Tamanho mínimo: **2 perguntas por tópico × dificuldade = 50 perguntas** (5 tópicos × 5 dificuldades × 2). Isso cobre:
- um nivelamento de até 20 perguntas sem repetir (as 20 saem de 50, passando por todas as dificuldades);
- pelo menos 6 práticas de 5 com as perguntas que sobram;
- os slots de revisão, que reaproveitam perguntas já respondidas.

Para testar a ordem de "Minhas tecnologias", o mock tem também 2 tecnologias de apoio (`python` e `go`), cada uma com 5 tópicos e ao menos 10 perguntas próprias nas fixtures. Uma fica pré-nivelada e a outra com nivelamento em andamento, com datas de atividade diferentes, num cenário de dev.

Além das perguntas, o mock tem entradas fixas para os cenários (uma tabela em `apps/web/src/mocks/scenarios.ts`; ADR 0005):

| Entrada ou gatilho | Resposta do mock |
|---|---|
| tecnologia `pizza` | `NOT_A_TECHNOLOGY` |
| tecnologia `limite` | `RATE_LIMITED` (com `retryAfterSeconds`) |
| tecnologia `cota` | `AI_QUOTA_EXCEEDED` |
| tecnologia `invalida` | `AI_INVALID_RESPONSE` |
| `reactjs` ou `ts` | resolve para TypeScript por alias, sem chamar "IA" |
| novo nivelamento até 7 dias depois de concluir | `PLACEMENT_COOLDOWN` com `retryAfterSeconds`, e `placementAvailableAt` = conclusão + 7 dias no resumo da prática |
| chave de dev "cooldown curto" | `placementAvailableAt` a menos de 1 dia, para testar "Disponível em N horas" |
| chave de dev "refazer em andamento" | tecnologia nivelada com um novo nivelamento `active` (`level` preenchido e `placementInProgress: true`) |
| chave de dev "catálogo cheio" | as 3 tecnologias em "Minhas tecnologias", com `lastActivityAt` diferentes |
| `POST /placement/sessions` com nivelamento ativo | retoma a pergunta atual, com `progress.answered` = respostas já dadas |
| nivelamento iniciado e não concluído | a tecnologia aparece em `GET /me/progress` com `level: null` e `placementInProgress: true` |
| report | guarda um report por usuário × pergunta (mantendo o 1º motivo); um 2º report devolve `204` sem somar; a pergunta passa a vir com `reportedByMe: true` |
| vidas chegam a 0 na prática | `NO_LIVES` com `retryAfterSeconds` (uma chave de dev permite começar com 1 vida) |
| prática com revisões vencidas | depois do 1º nivelamento, o mock marca 2 perguntas erradas como vencidas, para a 1ª prática ter 2 slots `review` |

## Tarefas

### backend-dev
- **B1. Monorepo e `packages/shared`** (sem rotas reais).
  - Arquivos: `packages/shared/package.json` (`@skillquest/shared`, `zod`), `tsconfig.json`, `src/index.ts`, `src/errors.ts`, `src/constants.ts`, `src/schemas/*.ts` e o subpath `fixtures`; `tsconfig.base.json` na raiz, se ainda não existir; dependência `@skillquest/shared: workspace:*` onde for usada.
  - Testes ao lado:
    - `QuestionDTOSchema` e `PracticeQuestionDTOSchema` recusam um objeto com `correctIndex` e exigem `reportedByMe`;
    - `PracticeQuestionDTOSchema` exige `source`;
    - `TechnologyInputSchema` aceita `" React "` → `react` e recusa 41 caracteres e `react<script>`;
    - `PracticeFeedbackRequestSchema` recusa `rating` desconhecido e campos extras;
    - `ReportQuestionRequestSchema` exige `reason` entre os 4 valores, aceita sem `details` e recusa `details` com 281 caracteres;
    - `PracticeSummaryDTOSchema` aceita `placementAvailableAt` `null` e ISO;
    - `MeProgressResponseSchema` aceita tecnologia com `level: null` e `placementInProgress: true` e exige `lastActivityAt`;
    - `ErrorCode` não tem `LESSON_LOCKED`.
  - Pronto quando: `pnpm --filter @skillquest/shared typecheck` e `test` passam e o `pnpm verify:fast` passa.
- **B2. Teste das fixtures.**
  - Arquivo: `apps/api/fixtures/fixtures.test.ts`, que valida as fixtures com o `TechnologyFixtureSchema` e verifica:
    - TypeScript: 5 tópicos, ≥ 2 perguntas por tópico × dificuldade, ids únicos, opções distintas;
    - `python` e `go`: 5 tópicos e ≥ 10 perguntas cada.
  - Pronto quando: o teste passa com os arquivos da tarefa A1.

### ai-prompt-engineer
- **A1. Conteúdo das fixtures.**
  - Arquivos: `apps/api/fixtures/typescript.json` (50 perguntas) e `python.json` e `go.json` (10 cada), em pt-BR, seguindo a skill `quiz-question-design` (4 opções plausíveis, 1 correta, explicação de até 2 frases, dificuldade coerente).
  - Pronto quando: o teste da B2 passa e uma revisão amostral (10 perguntas de TypeScript) não encontra ambiguidade.
  - Pode rodar em paralelo com a B1, desde que o formato do `QuestionFixtureSchema` seja combinado antes.

### frontend-dev
- **F1. Scaffold do `apps/web` + harness do web.**
  - Angular CLI (última estável, standalone, zoneless, sem SSR), Tailwind e Angular CDK (ADR 0002).
  - Arquivos: `apps/web/package.json` (`@skillquest/web`, scripts `dev`, `build`, `test`, `typecheck`, `lint`), `angular.json`, `tsconfig*.json`, `src/main.ts`, `src/app/app.config.ts`, `app.routes.ts`, `vercel.json`, `proxy.conf.json`.
  - Harness que entra com o web:
    - `angular-eslint` no `eslint.config.mjs`;
    - builder `@angular/build:unit-test` com `include` em `**/*.test.ts`;
    - Playwright + `@axe-core/playwright` na raiz (`e2e/`, `playwright.config.ts`, que sobe o `ng serve` com os mocks);
    - script `pnpm e2e` no `package.json` da raiz.
  - Pronto quando: `pnpm --filter @skillquest/web build` gera `apps/web/dist/web/browser`, um teste `app.component.test.ts` passa, `pnpm e2e` roda um smoke com axe, e `pnpm verify` passa (incluindo o `check:bundle` sobre um build real).
- **F2. Core** (depende de B1).
  - Arquivos em `src/app/core/`:
    - `api-client.ts`: métodos tipados por rota; faz `Schema.parse` em toda resposta e converte o erro da §4.6 em `ApiError { code, message, retryAfterSeconds? }`;
    - `auth.interceptor.ts`: injeta o Bearer só em URLs relativas `/api/`;
    - `auth.service.ts`: interface + token de DI;
    - `supabase-auth.service.ts` e `demo-auth.service.ts` (ADR 0005);
    - `auth.guard.ts`;
    - `error-messages.ts`: mensagem pt-BR por `ErrorCode`, com o tempo restante quando houver `retryAfterSeconds`;
    - `format-availability.ts`: função pura `formatAvailability(target, now)` (dias ou horas, para cima, singular e plural), que recebe `now` por parâmetro.
  - Pronto quando: os testes de cada arquivo passam, incluindo "resposta fora do schema vira erro tratado", "interceptor não envia token para outra origem" e os limites de `formatAvailability` (exatamente 24h, 23h01, 1 minuto, 6 dias e 1 hora).
- **F3. Design system em `src/app/shared/ui/`** (em paralelo com a F2).
  - Componentes: botão (primário e secundário, estado desabilitado com motivo), campo de texto com erro e contador, grupo de radio, card, barra de progresso, contador de vidas, badge de nível, selo ("Revisão", "Nivelamento em andamento"), diálogo (CDK `Dialog`), toast/alerta, skeleton de carregamento.
  - Tokens de cor e tipografia no Tailwind (contraste AA) e uma página `/_ui` de catálogo, só em dev.
  - **PAUSA:** o frontend-dev para e o orquestrador leva a identidade visual (cores, tipografia e a página `/_ui`) ao usuário. As telas (F6 a F11) só começam com a aprovação dele.
  - Pronto quando: cada componente tem teste e o axe não acusa violações na `/_ui`.
- **F4. Mocks MSW** (depende de B1 e A1; ADR 0005).
  - Arquivos: `src/mocks/browser.ts`, `node.ts`, `start.ts`, `start.noop.ts`, `db.ts`, `scenarios.ts`, `handlers/{catalog,placement,practice,progress,hint,report}.ts`, e a `fileReplacements` e o asset do worker só em `development` no `angular.json`.
  - Cada handler valida a entrada e faz `parse` da saída com os schemas de `packages/shared`.
  - Pronto quando:
    - os testes dos handlers passam: nenhuma pergunta antes da resposta tem `correctIndex`; o nivelamento termina entre 10 e 20; o nivelamento ativo é retomado e aparece em `/me/progress` com `placementInProgress`; `/me/progress` vem ordenado por `lastActivityAt`; o cooldown traz `retryAfterSeconds` e `placementAvailableAt`; a prática tem 5 perguntas com `source` e cobra vida no erro; o popup é idempotente; o report exige motivo, o 2º report do mesmo usuário não soma e mantém o 1º motivo, e a pergunta volta com `reportedByMe: true`;
    - o `check:bundle` passa sobre o build de produção.
- **F5. `QuestionPlayer`** (depende de F3; pode seguir antes da PAUSA, porque é comportamento e não identidade visual).
  - Arquivos: `src/app/shared/question-player/*`.
  - Pronto quando: os testes de componente cobrem teclado (1 a 4, Enter), anúncio do feedback, alternativa eliminada, foco, tópico e selo "Revisão", o diálogo de report (motivo obrigatório, limite de 280, confirmação) e o estado "Reportada ✓".
- **F6 a F11. Telas, uma por vez, nesta ordem:** shell (F6), login (F7), catálogo (F8), nivelamento (F9), resultado do nivelamento (F10), prática + popup + resultado da prática (F11).
  - Arquivos em `src/app/features/<tela>/`: componente da rota, serviço de sessão com signals (provido na rota) e teste.
  - Cada tela tem os estados carregando, erro (mensagem por `ErrorCode`) e vazio.
  - Pronto quando: os testes de componente da tela passam com o `msw/node` e a tela funciona no `ng serve` com os mocks.

### test-engineer
- **T1.** Revisar e completar os testes de componente de F5 a F11, garantindo um teste para cada CA abaixo, e marcar os CAs com `[x] … → caminho/do/teste`.
- **T2. E2E** em `e2e/fluxo-principal.spec.ts`, com Playwright + axe:
  - login demo → catálogo (TypeScript) → nivelamento até o resultado → prática de 5 → popup → resultado da prática → "Praticar de novo";
  - sair no meio de um nivelamento, ver "Nivelamento em andamento" no catálogo e "Continuar";
  - voltar ao catálogo e ver TypeScript em "Minhas tecnologias", no topo, abrindo direto a prática;
  - "Refazer nivelamento" desabilitado com o prazo;
  - report com motivo, seguido de "Reportada ✓";
  - cenários `pizza` e `limite` no catálogo;
  - vidas em 0 na prática;
  - axe sem violações sérias ou críticas em cada tela.
- Pronto quando: `pnpm e2e` e `pnpm verify` passam.

### Revisores (no fim de cada tela ou bloco)
- **code-reviewer:** padrões do ADR 0002, nenhum `any`, contratos só de `packages/shared`.
- **security-auditor:** `AuthService`, interceptor (token só para `/api/`), armazenamento da sessão, ausência de `correctIndex` antes da resposta (`source` e `reportedByMe` não revelam nada de outros usuários), MSW fora do build, detalhes do report tratados como dado (sem `innerHTML`).
- **ux-a11y-reviewer:** RNF-08 (teclado, foco, contraste AA, `radio` com rótulo, estados por texto), diálogos do popup e do report, botões desabilitados com motivo legível, mobile first.

## Ordem

1. Em paralelo: **B1** (shared), **A1** (fixtures, com o formato combinado), **F1** (scaffold + harness).
2. Depois de B1: **B2**, **F2** (core) e **F3** (design system), estas duas em paralelo.
3. Depois de B1 + A1: **F4** (mocks). Depois de F3: **F5** (QuestionPlayer).
4. **PAUSA**: aprovação da identidade visual pelo usuário.
5. Depois de F2, F4, F5 e da aprovação: **F6 → F7 → F8 → F9 → F10 → F11**, uma por vez, com **T1** e a revisão ao fim de cada uma.
6. Por último: **T2** (E2E) e a revisão final dos três revisores.

## Critérios de aceite

Funcionais
- [ ] CA-1 Login: com `supabaseUrl` vazio, só "Entrar no modo demo" fica habilitado; ao entrar, vai para o catálogo.
- [ ] CA-2 authGuard: acessar `/`, `/t/:id/nivelamento` ou `/t/:id/pratica` sem sessão redireciona para `/login`.
- [ ] CA-3 Shell: o cabeçalho mostra vidas, XP total e streak vindos de `GET /me/progress`; com vidas < 5, mostra o tempo até a próxima vida.
- [ ] CA-4 Catálogo: "Minhas tecnologias" aparece acima do campo de busca, com o nome e o nível (por nome) de cada tecnologia nivelada de `GET /me/progress`; sem nenhuma, mostra o estado vazio.
- [ ] CA-5 Catálogo: clicar numa tecnologia nivelada de "Minhas tecnologias", ou resolver pela busca uma tecnologia já nivelada, abre direto `/t/:id/pratica`, sem passar pelo nivelamento.
- [ ] CA-6 Catálogo: uma tecnologia com `placementInProgress: true` e `level: null` aparece com o rótulo "Nivelamento em andamento" e o botão "Continuar", que abre o nivelamento na pergunta atual.
- [ ] CA-7 Catálogo: uma tecnologia com `level` preenchido e `placementInProgress: true` mostra o nível atual; o clique principal abre a prática, e o botão secundário "Continuar nivelamento" abre o nivelamento na pergunta atual.
- [ ] CA-8 Catálogo: "Minhas tecnologias" segue a ordem de `lastActivityAt` decrescente (no cenário "catálogo cheio", a tecnologia com a atividade mais recente aparece primeiro).
- [ ] CA-9 Catálogo: a entrada é normalizada (`trim` e minúsculas); mais de 40 caracteres ou caractere fora de `[a-z0-9 .+#-]` mostra erro no campo e não chama a api.
- [ ] CA-10 Catálogo: `pizza` mostra a mensagem de `NOT_A_TECHNOLOGY`; `limite` mostra a de `RATE_LIMITED` com o tempo de espera; `cota` e `invalida` mostram as de `AI_QUOTA_EXCEEDED` e `AI_INVALID_RESPONSE`.
- [ ] CA-11 Catálogo: `ts` resolve para TypeScript e, se ainda não nivelada, lista os 5 tópicos com o CTA "Começar nivelamento".
- [ ] CA-12 Nivelamento: não há botão de dica; depois de cada resposta aparecem o acerto/erro, a alternativa correta e a explicação.
- [ ] CA-13 Nivelamento: o fluxo com os mocks termina com entre 10 e 20 respostas e leva ao resultado; nunca mostra "de 20" como se fosse o total exato.
- [ ] CA-14 Nivelamento: sair da tela no meio e voltar (sem recarregar) retoma na mesma pergunta, com o progresso "Pergunta n" das respostas já dadas.
- [ ] CA-15 Resultado do nivelamento: mostra o nível geral por nome e cada tópico com "forte", "fraco" ou "neutro" por texto; nenhum número de θ aparece na tela; as conquistas novas aparecem; o CTA "Praticar" abre a prática.
- [ ] CA-16 Prática: tem exatamente 5 perguntas, com progresso "n de 5".
- [ ] CA-17 Prática: cada pergunta mostra o nome do tópico; as perguntas com `source = review` mostram o selo "Revisão" por texto, e as `new` não.
- [ ] CA-18 Prática: um erro diminui as vidas no cabeçalho em 1; um acerto não.
- [ ] CA-19 Prática: a dica desabilita a alternativa devolvida em `eliminatedIndex`, com o texto "eliminada pela dica"; pedir de novo não muda nada; é uma dica por pergunta.
- [ ] CA-20 Prática: `NO_LIVES` (ao iniciar ou ao responder) mostra uma contagem regressiva a partir de `retryAfterSeconds`, que se atualiza a cada segundo, e deixa a revisão de explicações acessível.
- [ ] CA-21 Prática: com `placementAvailableAt` no futuro e sem nivelamento ativo, "Refazer nivelamento" já abre desabilitado (sem precisar clicar); com `null`, fica habilitado e abre o nivelamento; com nivelamento ativo, o botão é "Continuar nivelamento", habilitado.
- [ ] CA-22 `formatAvailability`: faltando ≥ 1 dia, mostra "Disponível em N dias" com N arredondado para cima (ex.: 6 dias e 1 hora → "7 dias"; exatamente 24h → "1 dia"); faltando < 1 dia, mostra "Disponível em N horas" arredondado para cima (ex.: 23h01 → "24 horas"; 1 minuto → "1 hora").
- [ ] CA-23 Report: no nivelamento e na prática, "Reportar pergunta" abre um diálogo com os 4 motivos fixos; "Enviar" fica desabilitado até escolher um motivo; os detalhes são opcionais e limitados a 280 caracteres (o 281º não entra); o envio chama `POST /questions/:id/report` com `{ reason, details? }`, mostra a confirmação e mantém a pergunta e o progresso da sessão.
- [ ] CA-24 Report feito: logo depois do envio, e sempre que a pergunta chegar com `reportedByMe: true`, o link aparece como "Reportada ✓", desabilitado, e o diálogo não abre.
- [ ] CA-25 Report repetido (mock): um 2º `POST /questions/:id/report` do mesmo usuário devolve `204`, não soma e mantém o 1º motivo.
- [ ] CA-26 Popup: abre ao fim de cada prática; Fácil, Na medida e Difícil chamam `POST /practice/sessions/:sessionId/feedback` com o `rating` certo e fecham o diálogo.
- [ ] CA-27 Popup: Esc ou "fechar" fecham o diálogo sem nenhuma chamada à api.
- [ ] CA-28 Resultado da prática: depois do popup (respondido ou fechado), mostra os acertos (n de 5), o XP ganho, o streak atual e as conquistas novas, com os botões "Praticar de novo" (inicia outra prática) e "Voltar ao catálogo".
- [ ] CA-29 ApiClient: uma resposta que não passa no schema de `packages/shared` vira um erro tratado na tela, e não um erro sem tratamento.

Acessibilidade (RNF-08)
- [ ] CA-30 QuestionPlayer: as opções são um grupo de `radio` com rótulo; as teclas 1 a 4 escolhem e Enter confirma; tudo funciona sem mouse.
- [ ] CA-31 QuestionPlayer: o feedback é anunciado pelo `LiveAnnouncer` e indicado por texto (não só por cor); o foco vai para o feedback depois de responder e para o enunciado na próxima pergunta.
- [ ] CA-32 Popup e diálogo de report: o foco fica preso no diálogo, começa no primeiro controle, Esc fecha e o foco volta para onde estava; o diálogo tem título acessível; os motivos do report são um grupo de `radio` com rótulo.
- [ ] CA-33 Botões e rótulos de estado expõem o motivo como texto lido por leitor de tela, e não só pela aparência: "Refazer nivelamento" desabilitado com "Disponível em N dias/horas" associado; "Reportada ✓" com nome acessível "Pergunta já reportada" (o ✓ fica `aria-hidden`); "Nivelamento em andamento" como texto.
- [ ] CA-34 O axe (`@axe-core/playwright`) não encontra violações sérias ou críticas em login, catálogo, nivelamento, resultado do nivelamento, prática, popup e resultado da prática.
- [ ] CA-35 Todo elemento interativo tem foco visível, e os textos e controles atendem o contraste AA (verificado pelo axe).

Segurança
- [ ] CA-36 Nenhuma resposta dos mocks que entrega pergunta (`POST /placement/sessions`, `POST /practice/sessions` e o `next.question` das respostas) contém `correctIndex` ou `explanation`; o `QuestionDTOSchema` e o `PracticeQuestionDTOSchema` (`.strict()`) recusam esses campos.
- [ ] CA-37 O build de produção de `apps/web` não contém `mockServiceWorker` nem `[MSW]` (`pnpm check:bundle` passa sobre `apps/web/dist`).
- [ ] CA-38 O interceptor só adiciona `Authorization: Bearer` em requisições para `/api/`; nenhuma requisição para outra origem leva o token.
- [ ] CA-39 Nenhum log do navegador (console) mostra token, e-mail ou `correctIndex` durante o fluxo do E2E.
- [ ] CA-40 Os detalhes do report são enviados e exibidos só como texto (sem `innerHTML`); um texto com `<script>` não executa nada.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Mock e api divergem | Os handlers fazem `parse` com os schemas de `packages/shared`; a api vai usar os mesmos schemas nos testes de integração (ADR 0005). |
| MSW ou fixtures (com respostas) vazam no build de produção | `fileReplacements` para o no-op, worker só como asset de dev, fixtures importadas só pelos mocks, e `check:bundle` no `verify` e no CI (CA-37). |
| As fixtures têm `correctIndex`, e o `packages/shared` é importado pela web | O schema de fixture fica num subpath separado (`@skillquest/shared/fixtures`), importado só pelos mocks e pela api; o `check:arch`/ESLint pode proibir esse import fora de `src/mocks/` (sugestão para o frontend-dev). |
| Nivelamento simulado esconde problemas da regra real (§6) | As telas dependem só do contrato (`next.question` ou `next.result`), nunca de um número fixo de perguntas (CA-13). |
| Estado em memória some ao recarregar | Documentado no ADR 0005; a retomada só é testada sem recarregar (CA-6, CA-7, CA-14), e a de verdade fica para quando houver api. |
| Relógio do cliente diferente do servidor no prazo do cooldown | `formatAvailability` usa o `now` do cliente sobre uma data ISO do servidor; uma diferença pequena só muda o texto arredondado. Se o `POST` ainda devolver `PLACEMENT_COOLDOWN`, vale o `retryAfterSeconds`. |
| Identidade visual retrabalhada depois das telas | PAUSA obrigatória depois da F3. |
| APIs do Angular mudaram (`httpResource`, builder `unit-test`, zoneless) | O frontend-dev consulta a documentação atual antes (agente frontend-dev, ADR 0002). |
| Dependências novas disparam o aviso do `check:arch` | Esperado: estão cobertas pelos ADRs 0002 e 0005; Playwright e axe, pela ARCHITECTURE §8 e pelo ADR 0003. |

## Decisões (usuário, 2026-11-25)

1. Catálogo mostra "Minhas tecnologias" (com o nível) acima da busca; tecnologia já nivelada abre direto a prática, com o botão secundário "Refazer nivelamento" (respeitando os 7 dias). → CA-4, CA-5, CA-21.
2. Depois do popup (respondido ou fechado), o usuário fica no resultado da prática (acertos, XP, streak, conquistas novas), com "Praticar de novo" e "Voltar ao catálogo". → CA-28.
3. `POST /placement/sessions` com nivelamento `active` da tecnologia retoma a sessão na pergunta atual (ARCHITECTURE §4.1 e §5). → CA-14.
4. A prática mostra o tópico e o selo "Revisão" nos slots `source = review`, pelo campo `source` do `PracticeQuestionDTO` (ARCHITECTURE §4), que não revela a resposta. → CA-17, CA-36.
5. O resultado do nivelamento mostra só o nível por nome e os tópicos forte/fraco/neutro, sem θ numérico. → CA-15.
6. "Reportar pergunta" entra na rodada 1, funcionando, no nivelamento e na prática (`POST /questions/:id/report`). → CA-23, CA-32, CA-40.
7. Modo demo com api real: usuário demo fixo no Supabase, pelo botão "Entrar no modo demo", com dados resetados periodicamente e `AI_PROVIDER=mock`. Na rodada 1 continua o `DemoAuthService` com MSW (ADR 0005). → CA-1.
8. `PLACEMENT_COOLDOWN` inclui `retryAfterSeconds` (ARCHITECTURE §4.6). → CA-21, CA-33.
9. `PracticeSummaryDTO` ganha `placementAvailableAt: string | null` (ISO; `null` = pode refazer já). "Refazer nivelamento" já abre desabilitado. O texto é "Disponível em N dias" (para cima) ou, com menos de 1 dia, "Disponível em N horas" (para cima); o RF-12 foi ajustado. → CA-21, CA-22, CA-33.
10. Report com motivo obrigatório entre `resposta_errada`, `ambigua`, `mais_de_uma_correta` e `outro`, mais um `details` opcional de até 280 caracteres (`{ reason, details? }`, RF-25). → CA-23.
11. Report idempotente por usuário × pergunta: guardado em `question_reports` (PK `user_id, question_id`, RLS sem acesso de clientes, ARCHITECTURE §3.3), pela RPC `report_question`. Só usuários distintos contam para os 3 que dão `retired`. → CA-25.
12. "Minhas tecnologias" lista também as tecnologias com nivelamento `active` não concluído, com o rótulo "Nivelamento em andamento" e o botão "Continuar", que retoma a sessão (`MeProgressResponse` com `level: null` e `placementInProgress`). → CA-6, CA-33.
13. `QuestionDTO` (nivelamento e prática) ganha `reportedByMe: boolean`. Com `true`, o link vira "Reportada ✓", desabilitado. Um 2º report mantém o 1º motivo (ARCHITECTURE §3 e §4). → CA-24, CA-25, CA-33.
14. Tecnologia já nivelada com um novo nivelamento `active`: mostra o nível do último concluído; o clique principal leva à prática, e o botão secundário "Continuar nivelamento" retoma a sessão (ARCHITECTURE §5). → CA-7, CA-21.
15. "Minhas tecnologias" é ordenada pela tecnologia usada mais recentemente (última prática ou nivelamento), com `lastActivityAt` em `MeProgressResponse` e a ordem feita pela api. → CA-8.

## Decisões menores (revisáveis)

Decisões de interface tomadas pelo padrão mais simples e acessível. Podem ser revistas sem mudar regra de negócio.

1. O ✓ de "Reportada ✓" é decorativo (`aria-hidden`); o nome acessível do controle é "Pergunta já reportada".
2. Depois de um report com `204`, o link vira "Reportada ✓" na hora, sem esperar a pergunta ser entregue de novo.
3. A mensagem de confirmação do report é "Obrigado, vamos revisar".
4. Os motivos do report aparecem como "Resposta errada", "Ambígua", "Mais de uma correta" e "Outro", nessa ordem.
5. "Enviar" no report fica desabilitado até um motivo ser escolhido (em vez de mostrar erro depois do clique).
6. Empate em `lastActivityAt` na lista de "Minhas tecnologias": ordem alfabética do nome.
7. Na prática, com nivelamento `active` da tecnologia, o botão secundário mostra "Continuar nivelamento" no lugar de "Refazer nivelamento".
8. Iniciar ou continuar um nivelamento a partir da prática não mexe na prática `active`: ela continua retomável dentro das 24h.
9. Na busca do catálogo, uma tecnologia só com nivelamento em andamento leva direto ao nivelamento (retomado), como o "Continuar" da lista.
10. Singular e plural em "Disponível em": "1 dia"/"N dias", "1 hora"/"N horas".
11. O progresso do nivelamento mostra "Pergunta n", sem total, porque o fim varia entre 10 e 20.
12. Estado vazio do catálogo: "Você ainda não nivelou nenhuma tecnologia", com o foco indo para o campo de busca.
13. Botões desabilitados usam `disabled` nativo, com o motivo em texto visível ao lado e associado por `aria-describedby`.
