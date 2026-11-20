---
paths:
  - "apps/api/**"
---

# Regras da API (apps/api)
- Framework: Hono em Node 24. Um módulo por pasta em src/modules/<modulo>/ com routes.ts, service.ts e repo.ts.
- Valide toda entrada (body, params, query) com os schemas Zod de packages/shared.
- Chamadas à Gemini API só em src/modules/ai/, via QuestionGenerator. Use saída estruturada (JSON Schema) e
  valide a resposta com Zod antes de salvar ou devolver.
- Nunca registre em log a chave da API, tokens ou dados pessoais do usuário.
- Rate limit por usuário em todas as rotas que chamam a IA.
- Erros: devolva JSON { error: { code, message } } com status HTTP adequado.
- Banco: Supabase com RLS ativo; mudanças de schema só por nova migration.

## Estrutura
- Um módulo por pasta em `src/modules/<modulo>/`: `routes.ts` (Hono), `service.ts` (regra de negócio), `repo.ts` (acesso ao Supabase).
  As rotas não acessam o banco direto, e os repos não têm regra de negócio.
- `leveling` e `srs` são funções puras: sem I/O, sem `Date.now()` interno (recebem `now` por parâmetro). Fórmulas em docs/ARCHITECTURE.md §6 e §7: mudou a fórmula, atualize o doc.

## Contratos
- Body, query e params são validados com os schemas de `packages/shared`; não declare schemas de contrato dentro da api.
- O tipo de resposta de cada rota vem de `packages/shared` (`z.infer`). Mudou o contrato, mude primeiro em shared.
- Erros sempre no formato `{ error: { code, message } }`, com `code` do enum `ErrorCode` em shared, lançados por um handler central (`app.onError`). Nunca devolva stack trace ou mensagem crua do Supabase/Gemini.

## Segurança e dados
- Toda rota passa pelo middleware de auth. O `userId` vem **só** do JWT validado, nunca do body ou da query.
- A api usa a service role, que ignora o RLS: **toda** query em tabela do usuário filtra por `user_id`.
- Pergunta enviada ao cliente passa por `toQuestionDTO()`, que remove `correct_index` e `explanation`. A correção acontece no servidor (RNF-04).
- Não logue tokens, chaves, e-mails nem prompts completos.

## Vercel (serverless)
- Sem estado em variável de módulo (cache, contadores, rate limit): o que precisar persistir vai para o Postgres.
- Trabalho depois da resposta (pré-busca de perguntas) só com `waitUntil` de `@vercel/functions`; promise solta pode não rodar.
- Banco via `supabase-js`; não abra pool `pg` direto.
- Runtime Node; não dependa de APIs exclusivas do Edge.

## IA
- Módulos chamam a IA só pela interface `QuestionGenerator` (`src/modules/ai`); nunca importe o adaptador do Gemini fora de `ai/`.
- A entrada do usuário (nome da tecnologia) é normalizada e vai ao prompt delimitada como dado (ARCHITECTURE §2), nunca concatenada nas instruções.
- Toda chamada ao Gemini tem timeout. HTTP 429/cota vira `AI_QUOTA_EXCEEDED`; depois de falhar a validação 2 vezes, vira `AI_INVALID_RESPONSE`.
