# ADR 0001: FSRS (ts-fsrs) em vez de SM-2 próprio

- **Status:** aceito
- **Data:** 2026-11-20

## Contexto
O ARCHITECTURE v0.2 previa um SM-2 simplificado próprio, com nota binária (acerto q = 4, erro q = 1). A skill `.claude/skills/spaced-repetition` previa o FSRS por meio de uma biblioteca mantida, com 4 notas. Os dois divergiam e era preciso escolher um.

## Opções consideradas
1. **SM-2 próprio, nota binária:** simples e sem dependência. Por outro lado, o algoritmo é antigo e o código e os testes de agendamento ficam por nossa conta.
2. **FSRS via `ts-fsrs`, com Again, Hard, Good e Easy:** algoritmo mais moderno e biblioteca mantida. Exige uma dependência nova e dois sinais que o produto ainda não tinha: uso de dica (para Hard) e tempo de resposta (para Easy).
3. **FSRS via `ts-fsrs`, só com Again e Good:** fica com a biblioteca sem criar a dica nem medir o tempo, mas desperdiça parte do modelo.

## Decisão
Opção 2.
- **Notas:**
  - erro → Again;
  - acerto com dica → Hard;
  - acerto sem dica, em menos de 5s, numa pergunta de dificuldade ≥ 3 → Easy;
  - qualquer outro acerto → Good.
- **Retenção desejada:** 0,9.
- **Dica:** elimina 1 alternativa errada, sorteada no servidor, sem chamar a IA (RF-23).
- **Tempo de resposta:** medido **no servidor** (chegada da resposta − `servedAt`), para o cliente não conseguir fraudar.

## Consequências
- **Dependência nova:** `ts-fsrs`. Confirme a versão e os campos de `Card` ao instalar.
- **Banco:**
  - `review_items` guarda o estado do cartão FSRS, e não mais `ease`, `interval_days` e `repetitions`;
  - `answers` ganha `hint_used` e `response_ms`;
  - `study_sessions.slots` ganha `servedAt` e `hintIndex`;
  - `placement_sessions` ganha `current_served_at`.
- **Funcionalidade e rota novas:** `POST /study-sessions/:sessionId/hint` (ARCHITECTURE §4.7). Acerto com dica dá metade do XP e não altera θ nem `b`.
- **Latência:** o tempo medido inclui a latência de rede, então o limite de 5s para Easy fica um pouco mais rígido. Ajuste com dados reais.
- **Testes:** cobrem `toRating`, uma função pura, e o agendamento com datas fixas. A matemática do FSRS fica com a biblioteca.
