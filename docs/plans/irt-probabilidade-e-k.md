# Plano: probabilidade de acerto e fator K do IRT (demo do harness)

**Objetivo:** implementar as duas primeiras funções puras de `leveling` (ARCHITECTURE §0 e §6), que o nivelamento vai usar para atualizar θ.

**Fonte:** ARCHITECTURE §6 e a skill `adaptive-leveling`. Nenhuma regra nova: as fórmulas e os números vêm do documento.

## Contratos
Sem rota e sem schema. Funções puras em `apps/api/src/modules/leveling/irt.ts`:
- `probabilityCorrect(theta: number, b: number): number` → `1 / (1 + e^−(θ − b))`
- `kFactor(answered: number): number` → `max(0,3; 0,8 · 0,9^n)`, com n = respostas já dadas na sessão

## Tarefas
- **backend-dev:** `irt.ts` + `irt.test.ts` ao lado.

## Critérios de aceite
- [x] CA-1 → `apps/api/src/modules/leveling/irt.test.ts` — P(θ, b): 0,5 quando θ = b, e os valores do exemplo da §6 (θ 0,40 / b 0 → 0,60; θ −0,03 / b 0 → 0,49), com `toBeCloseTo`
- [x] CA-2 → `apps/api/src/modules/leveling/irt.test.ts` — K_n: n = 0, 1, 2 → 0,80, 0,72, 0,648 (exemplo da §6); nunca abaixo de 0,3 (n = 10 e n = 50 → 0,3)
- [x] CA-3 → `scripts/harness/eslint-rules.test.mjs` — Módulo puro: sem I/O nem relógio (regra de ESLint dos módulos puros)

## Fora do escopo
- Atualização de θ, informação de Fisher, SE, critério de parada e conversão em nível: ficam para o plano do nivelamento.
