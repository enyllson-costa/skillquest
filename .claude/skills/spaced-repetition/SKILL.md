---
name: spaced-repetition
description: Regras da repetição espaçada do SkillQuest - agendamento de revisões, montagem da lição diária e casos de teste. Use ao implementar ou testar revisões, a lição do dia ou o histórico de respostas.
---
# Repetição espaçada

Fonte da verdade: docs/ARCHITECTURE.md §7.2–§7.5 (e o ADR docs/ADR/0001-fsrs-em-vez-de-sm2.md). Se divergirem do texto abaixo, siga os documentos e avise.

## Algoritmo
Use FSRS por meio de uma biblioteca mantida (ts-fsrs), não uma implementação própria. Verifique a versão atual antes de instalar.
- Cada par (usuário, questão) é um "cartão" (`review_items`), com o estado do `Card` do ts-fsrs salvo no banco.
- Cartões são criados/atualizados por: erro no nivelamento (Again), respostas em lições, na revisão do "Hoje" e na revisão de erros.
- Mapeamento da resposta para a nota do FSRS (função pura `toRating`):
  - Errou → Again
  - Acertou depois de usar a dica (eliminar 1 alternativa) → Hard
  - Acertou sem dica, em menos de 5000 ms, numa questão de dificuldade ≥ 3 → Easy
  - Qualquer outro acerto → Good
- O tempo de resposta (`response_ms`) é medido **no servidor**: chegada da resposta − `servedAt` da questão na sessão. Nunca confie em tempo enviado pelo cliente.
- Retenção desejada padrão: 0,9.

## Prática do dia ("Hoje")
- Revisão: até 5 cartões vencidos da tecnologia, os mais atrasados primeiro, numa sessão própria.
- Lição do dia: a próxima lição da trilha (6 questões, conclui com ≥ 4 acertos), separada da revisão.
- Trilha toda concluída → a revisão é completada até 10 questões com reforço dos 2 tópicos mais fracos.
- Questão errada não volta na mesma lição.

## Regras de tempo
- "Hoje" é sempre calculado no fuso horário do usuário, nunca no do servidor.
- Toda a lógica de datas recebe "agora" como parâmetro (facilita testes).

## Casos que precisam de teste (com datas fixas)
- Questão errada hoje aparece de novo amanhã.
- Questão acertada 3 vezes seguidas tem intervalo crescente.
- Usuário volta após 30 dias: a revisão do "Hoje" não ultrapassa 5 questões mesmo com 100 cartões vencidos.
- `toRating`: acerto com dica → Hard; acerto rápido (< 5s) sem dica em dificuldade ≥ 3 → Easy; o mesmo acerto rápido em dificuldade 2 → Good; acerto com dica e rápido → Hard.
- Virada de dia em fusos diferentes (America/Fortaleza vs UTC).
