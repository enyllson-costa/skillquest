---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
---

# Regras de testes
- Padrão Arrange-Act-Assert, um comportamento por teste, nomes descritivos em português.
- Unidade e componente: Vitest + Testing Library; busque elementos por papel
  (getByRole), não por classe CSS.
- Mocke a Claude API com MSW; nenhum teste chama a IA de verdade.
- Datas fixas (vi.setSystemTime) em testes de streak e repetição espaçada.
- E2E com Playwright cobrindo os fluxos: nivelamento completo, lição completa,
  perder todas as vidas.

## Geral
- Teste fica ao lado do código (`foo.ts` → `foo.test.ts`). E2E fica em `e2e/` como `*.spec.ts`.
- Nenhum teste chama rede real. O Gemini é mockado com MSW, interceptando `generativelanguage.googleapis.com`, ou com `AI_PROVIDER=mock`.
- Tempo controlado: passe `now` por parâmetro ou use `vi.useFakeTimers()` / `vi.setSystemTime()`. Nunca dependa do relógio real.

## O que cada área precisa cobrir
- **leveling / srs:** testes em tabela (`it.each`) com valores numéricos e `toBeCloseTo`, incluindo o exemplo de ARCHITECTURE §6. Cubra os limites: K mínimo, parada por SE e por máximo de 20, faixas de nível, ease mínimo 1,3.
- **Pipeline de IA:** um caso para cada saída do MSW: resposta válida, JSON quebrado, schema inválido (por exemplo 2 opções corretas), opções repetidas e HTTP 429. Verifique a nova tentativa e os códigos `AI_INVALID_RESPONSE` / `AI_QUOTA_EXCEEDED`.
- **Rotas da api:** 401 sem token; usuário A não lê nem altera dados do usuário B; resposta de pergunta **não** contém `correctIndex` antes de o usuário responder.
- **Gamificação:** regeneração de vidas por tempo, `NO_LIVES`, streak na virada do dia no fuso do usuário (pelo menos um fuso diferente de UTC).

## Componentes (Testing Library)
- Consulte por papel e rótulo (`getByRole`, `getByLabelText`); `getByTestId` só como último recurso.
- Use `userEvent`, não `fireEvent`.
- Sem snapshot de componente inteiro; verifique o comportamento visível.

## E2E (Playwright)
- Rode contra a api com `AI_PROVIDER=mock` e fixtures determinísticas.
- Cubra o fluxo principal: login, resolver tecnologia, nivelamento até o resultado, sessão de prática.
