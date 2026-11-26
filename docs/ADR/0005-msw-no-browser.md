# ADR 0005: Telas desenvolvidas contra MSW no navegador, antes da api real

- **Status:** aceito
- **Data:** 2026-11-25

## Contexto
A rodada 1 do front (shell, login, catálogo, nivelamento, resultado, prática de 5 e popup "Como foi?", ARCHITECTURE v0.4) vai ser feita antes de existir a api real. Hoje `apps/api` tem só `leveling/irt.ts`; não há rotas, banco, projeto Supabase nem chave do Gemini. O projeto já usa o MSW 3 nos testes da api, para interceptar o Gemini (ARCHITECTURE §8, ADR 0003). O harness já tem o `check:bundle` (`scripts/harness/check-bundle.mjs`), que falha se `mockServiceWorker` ou `[MSW]` aparecerem em `apps/web/dist`.

Para fazer as telas agora, a web precisa de respostas realistas para as rotas da §4, que respeitem os contratos de `packages/shared` e o RNF-04 (a resposta correta não vai ao cliente antes da resposta do usuário). Precisa também de um login que funcione sem Supabase.

## Opções consideradas
1. **Esperar a api:** sem mock nenhum, mas as telas ficam paradas atrás do backend inteiro (banco, auth, IA).
2. **Serviços fake dentro do Angular** (trocar o `ApiClient` por uma implementação em memória via DI): simples, mas o código HTTP real (interceptor, parse, erros) não é exercitado, e o fake vive dentro do app.
3. **Servidor de mock separado** (json-server, Prism): exercita o HTTP, mas é mais um processo e mais uma dependência, e não valida contra os schemas Zod sem código extra.
4. **MSW no navegador (dev) e em Node (testes de componente):** intercepta o `fetch`/XHR real, então o `ApiClient`, o interceptor e o tratamento de erros rodam como em produção. O MSW já é dependência do projeto, e os mesmos handlers servem para dev e para os testes.

## Decisão
Opção 4.
- **Onde roda:** no navegador em dev (`ng serve`), com `setupWorker` de `msw/browser`, e nos testes de componente, com `setupServer` de `msw/node`. Os mesmos handlers ficam em `apps/web/src/mocks/handlers/`.
- **Fora do bundle de produção:**
  - o worker é iniciado só em dev, por import dinâmico (`await import('./mocks/browser')`) antes do `bootstrapApplication`;
  - como um import dinâmico ainda gera um chunk, o ponto de entrada dos mocks (`src/mocks/start.ts`) é trocado por um no-op (`src/mocks/start.noop.ts`) via `fileReplacements` na configuração `production` do `angular.json`. Assim, nenhum código do MSW entra no build;
  - o `mockServiceWorker.js` fica fora de `public/` e só é copiado como asset na configuração `development`;
  - o `pnpm check:bundle` é a garantia final: falha se achar `mockServiceWorker` ou `[MSW]` em `apps/web/dist`.
- **Os handlers validam as próprias respostas** com os schemas Zod de `packages/shared` (`ResponseSchema.parse(body)` antes de devolver) e validam a requisição com o schema de entrada. Se o mock sair do contrato, ele quebra em dev e nos testes. Quando a api existir, os testes de integração dela usam os mesmos schemas, então mock e api não divergem. As respostas de erro também passam pelo `ErrorResponseSchema`.
- **RNF-04:** os handlers montam cada pergunta com uma função `toQuestionDTO()` própria dos mocks, que devolve só os campos do `QuestionDTO` (ou do `PracticeQuestionDTO`, que acrescenta `source`), ambos `.strict()`. `correctIndex` e `explanation` só aparecem no `AnswerFeedback`, depois da resposta.
- **Fixtures:** a fonte única é `apps/api/fixtures/` (ARCHITECTURE §0 e §8), validada por um schema de fixture em `packages/shared`. Os mocks da web importam esse JSON; como ficam só no código de mocks, o conteúdo também fica fora do build de produção.
- **Estado dos mocks:** em memória, num módulo `apps/web/src/mocks/db.ts` (sessões, vidas, XP, streak, offset do popup, nivelamentos concluídos e cooldown). O nivelamento adaptativo é simulado de forma simples (dificuldade ±1 a cada resposta, com clamp 1–5, e parada entre a 10ª e a 20ª), e não com o IRT real. A api é stateless (§9), mas essa regra vale para `apps/api`, não para os mocks do navegador.
- **Cenários de erro:** entradas e chaves fixas acionam os erros da §4.6 (por exemplo, uma tecnologia que devolve `NOT_A_TECHNOLOGY`), para as telas e o E2E cobrirem os estados de erro sem mexer no código.
- **Auth:** a interface `AuthService` (`session`, `accessToken()`, `signInWithMagicLink(email)`, `signInWithGitHub()`, `signInDemo()`, `signOut()`) tem duas implementações: `SupabaseAuthService` e `DemoAuthService` (modo demo, RF-13). Uma factory escolhe a implementação pela configuração pública: sem `supabaseUrl`, só o demo fica disponível. Enquanto não houver projeto Supabase, o dev usa o demo. O interceptor só põe o Bearer em requisições para o caminho relativo `/api/`.
- **Modo demo com a api real** (decisão do usuário, 2026-11-25):
  - existe um **usuário demo fixo no Supabase**, e o botão "Entrar no modo demo" faz login com ele;
  - os dados desse usuário são **resetados periodicamente**;
  - a api atende o demo com `AI_PROVIDER=mock`, para o demo nunca gastar cota do Gemini (RNF-01, RF-13).
  - **Na rodada 1**, sem projeto Supabase, o demo continua sendo o `DemoAuthService` contra o MSW. Quando a api existir, `signInDemo()` passa a autenticar o usuário demo no Supabase; a interface `AuthService` não muda.
  - Como isso é implementado (credencial do usuário demo, mecanismo e frequência do reset, como a api liga o `mock` só para o demo) fica para o plano da api.

## Consequências
- **Dependências na web:** `msw` (dev). O `check:arch` vai avisar sobre dependências novas em `apps/web/package.json`; Angular, CDK e Tailwind estão cobertos pelo ADR 0002, e o MSW por este ADR.
- **Comportamento simplificado:** o nivelamento dos mocks não usa o IRT, então o número de perguntas e o nível final em dev não refletem a regra real (§6). As telas não podem depender de nada além do contrato (por exemplo, não podem presumir que o nivelamento acaba numa pergunta específica).
- **Estado perdido ao recarregar:** com o estado em memória, recarregar a página zera as sessões dos mocks. O "retomar sessão" (nivelamento e prática) é simulado dentro da mesma carga da página e só pode ser testado de verdade contra a api real.
- **Retirar os mocks quando a api existir:** o `ng serve` passa a usar o `proxy.conf.json` para a api local, e os handlers deixam de ser carregados em dev (configuração `development-mock` separada, ou remoção). Os handlers podem continuar nos testes de componente. Os testes E2E passam a rodar contra a api com `AI_PROVIDER=mock`.
- **Risco de divergência:** é mitigado pela validação com os schemas de `packages/shared` nos dois lados. O que um schema não captura (regras de negócio, como os limites do offset) pode divergir; os testes de integração da api são a fonte de verdade.
- **Modo demo em produção:** o `DemoAuthService` (e, depois, o login do usuário demo) vai para o build de produção (RF-13), mas o MSW não. Os dados do usuário demo são compartilhados entre visitantes, então nada pessoal deve ser digitado nele (o reset periódico limita o acúmulo).
