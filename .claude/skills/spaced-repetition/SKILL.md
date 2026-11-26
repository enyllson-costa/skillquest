---
name: spaced-repetition
description: Regras da repetição espaçada do SkillQuest - agendamento de revisões, composição da prática de 5 perguntas, ajuste pelo popup "Como foi?" e casos de teste. Use ao implementar ou testar revisões, a prática ou o histórico de respostas.
---
# Repetição espaçada e prática

Fonte da verdade: docs/ARCHITECTURE.md §7.3–§7.5, o ADR docs/ADR/0001-fsrs-em-vez-de-sm2.md e o ADR docs/ADR/0004-quiz-sem-trilha.md. Se divergirem do texto abaixo, siga os documentos e avise.

## Algoritmo
Use FSRS por meio de uma biblioteca mantida (ts-fsrs), não uma implementação própria. Verifique a versão atual antes de instalar.
- Cada par (usuário, questão) é um "cartão" (`review_items`), com o estado do `Card` do ts-fsrs salvo no banco.
- Cartões são criados/atualizados por: erro no nivelamento (Again), respostas na prática e na revisão de erros.
- Mapeamento da resposta para a nota do FSRS (função pura `toRating`):
  - Errou → Again
  - Acertou depois de usar a dica (eliminar 1 alternativa) → Hard
  - Acertou sem dica, em menos de 5000 ms, numa questão de dificuldade ≥ 3 → Easy
  - Qualquer outro acerto → Good
- O tempo de resposta (`response_ms`) é medido **no servidor**: chegada da resposta − `servedAt` da questão na sessão. Nunca confie em tempo enviado pelo cliente.
- Retenção desejada padrão: 0,9.

## Prática de 5 perguntas
- Livre: quantas vezes o usuário quiser; a 1ª sessão terminada no dia (prática ou revisão de erros) cumpre a meta diária.
- Composição: até **2** cartões vencidos da tecnologia (os mais atrasados primeiro, servidos primeiro) + 3 a 5 perguntas novas. Vencidos que sobram ficam para as próximas práticas.
- Perguntas novas alternam entre os **2 tópicos de menor θ_tópico**.
- Dificuldade **fixa na sessão**, calculada no início: `clamp(round(θ_tópico) + 3 + offset, 1, 5)`, com `offset` do popup.
- Uma prática ativa por tecnologia, retomável; vira `abandoned` após 24h sem resposta; iniciar com 0 vidas → `NO_LIVES`.
- Ao terminar (5 respostas): +20 XP, com qualquer número de acertos.

## Popup "Como foi?" (RF-24)
- Fácil → `offset + 1`; Na medida → 0; Difícil → `offset − 1`. Acumula entre práticas, limitado a **−2..+2**.
- Guardado em `practice_prefs` por usuário × tecnologia; não altera θ; volta a 0 ao refazer o nivelamento.
- Fechar sem responder equivale a "Na medida" e não grava nada. A revisão de erros não tem popup.

## Regras de tempo
- "Hoje" (meta diária, streak) é sempre calculado no fuso horário do usuário, nunca no do servidor.
- Toda a lógica de datas recebe "agora" como parâmetro (facilita testes).

## Casos que precisam de teste (com datas fixas)
- Questão errada hoje aparece de novo amanhã.
- Questão acertada 3 vezes seguidas tem intervalo crescente.
- Usuário volta após 30 dias com 100 cartões vencidos: a prática tem no máximo 2 revisões e continua com 5 perguntas.
- Sem cartões vencidos: as 5 perguntas são novas.
- Popup: Fácil, Fácil, Fácil → offset +2 (não passa de +2); dificuldade final nunca sai de 1–5; refazer o nivelamento zera o offset.
- `toRating`: acerto com dica → Hard; acerto rápido (< 5s) sem dica em dificuldade ≥ 3 → Easy; o mesmo acerto rápido em dificuldade 2 → Good; acerto com dica e rápido → Hard.
- Virada de dia em fusos diferentes (America/Fortaleza vs UTC).
