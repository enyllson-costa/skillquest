---
name: adaptive-leveling
description: Regras do quiz de nivelamento adaptativo do SkillQuest - estimativa de habilidade, escolha da próxima questão, critério de parada e conversão em nível. Use ao implementar ou testar o fluxo de nivelamento, a pontuação ou a tela de resultado.
---
# Nivelamento adaptativo

Fonte da verdade: docs/ARCHITECTURE.md §5 (fluxo) e §6 (algoritmo). Este arquivo é um resumo; se divergir do documento, siga o documento e avise a divergência. Mudou uma fórmula ou constante? Atualize os dois.

## Modelo (IRT 1PL / Elo)
- Habilidade do usuário: θ, começa em 0. Sem trava de θ (escala logit, na prática entre −3 e +3).
- Dificuldade inicial da questão: b = dificuldade da IA − 3 → −2, −1, 0, +1, +2 para os níveis 1 a 5.
- Probabilidade de acerto: P = 1 / (1 + e^−(θ − b)).

## Atualização após cada resposta
- θ ← θ + K_n × (r − P), com r = 1 (acerto) ou 0 (erro).
- K_n = max(0,3; 0,8 × 0,9^n), n = respostas já dadas na sessão.
- Informação acumulada: info ← info + P × (1 − P); SE = 1 / √info.
- Recalibração de b (questão com ≥ 5 respostas): b ← b − 0,05 × (r − P). Não vale no contexto `mistakes`.
- Resposta dada com dica (só existe fora do nivelamento) não altera θ nem b.
- Fora do nivelamento (lições, revisões), θ usa K fixo = 0,3; a revisão de erros não altera θ.

## Escolha da próxima questão
1. Tópico: o que tem menos respostas nesta sessão (empate: ordem do tópico).
2. Dificuldade alvo: clamp(round(θ) + 3, 1, 5). Sem aquecimento.
3. Reaproveita uma questão `active` do tópico com |b − θ| ≤ 0,5 que o usuário **nunca** respondeu (em nenhuma sessão); se não houver, gera uma nova.
4. Pré-busca (com `waitUntil`) das candidatas para "acertou" e "errou", gravadas em `placement_sessions.prefetch`.

## Critério de parada
Pelo menos 8 questões e SE < 0,6, **ou** 20 questões respondidas (o que vier primeiro).

## Conversão em nível
| θ final | Nível |
| --- | --- |
| < −1,5 | iniciante |
| −1,5 a < −0,5 | básico |
| −0,5 a < 0,5 | intermediário |
| 0,5 a < 1,5 | avançado |
| ≥ 1,5 | especialista |

## Lacunas por tópico
- Cada tópico tem θ_tópico próprio (`skill_estimates`), que começa no θ geral do momento da 1ª resposta do tópico e segue a mesma regra de atualização.
- Rótulo no resultado: forte se θ_tópico ≥ θ + 0,5, fraco se ≤ θ − 0,5, neutro no resto ou com menos de 2 respostas.
- Todos os tópicos alimentam a trilha (§7.1), ordenados por θ_tópico crescente; dominado = θ_tópico ≥ 0,5 com ≥ 2 respostas (vira unidade `tested`).

## Casos que precisam de teste
- O exemplo numérico do §6 (θ: 0 → 0,40 → −0,03 → 0,30), com `toBeCloseTo`.
- Acerta tudo → termina como especialista sem passar de 20 questões.
- Erra tudo → termina como iniciante; θ decresce e continua finito.
- Alterna certo/errado em dificuldade 3 → termina como intermediário.
- Para antes de 20 quando SE < 0,6 a partir da 8ª questão; nunca para antes da 8ª.
- K nunca fica abaixo de 0,3.
- Recarregar a página no meio não perde o progresso (estado salvo no servidor).
