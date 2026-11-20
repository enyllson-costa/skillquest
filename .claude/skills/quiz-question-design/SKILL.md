---
name: quiz-question-design
description: Padrões de qualidade das questões de múltipla escolha do SkillQuest - estrutura, níveis de dificuldade, distratores, explicações e exemplos bons e ruins. Use ao escrever ou revisar prompts de geração de questões, schemas de questão ou evals.
---
# Design de questões do SkillQuest

Se algo aqui divergir de docs/ARCHITECTURE.md, o documento de arquitetura vence; avise a divergência.

## Estrutura obrigatória
- Enunciado claro, autocontido, até 280 caracteres (código pode ir num bloco separado de até 15 linhas).
- 4 alternativas de tamanho e estilo parecidos; exatamente 1 correta.
- Campos: tecnologia, subtópico, dificuldade (1-5), nível de Bloom, explicação (até 60 palavras).

## Dificuldade (alinhada à taxonomia de Bloom)
| Nível | Bloom | O que testa | Exemplo (React) |
| --- | --- | --- | --- |
| 1 | Lembrar | Definição, sintaxe | Qual hook guarda estado local? |
| 2 | Entender | Explicar um conceito | Por que a key importa numa lista? |
| 3 | Aplicar | Usar em situação comum | Qual código busca dados ao montar o componente? |
| 4 | Analisar | Encontrar o bug, comparar abordagens | Por que este useEffect entra em loop? |
| 5 | Avaliar | Trade-offs em cenário real | Qual estratégia de estado escala melhor neste app? |

## Distratores
- Cada distrator representa um erro real de quem sabe parcialmente (confusão comum, versão antiga da API, regra mal lembrada).
- Proibido: "todas as anteriores", "nenhuma das anteriores", alternativas absurdas, pegadinhas de leitura.
- A correta não pode ser sistematicamente a mais longa ou a mais detalhada.

## Explicação
Diga por que a correta está certa e, em uma frase, por que o distrator mais tentador está errado.

## Exemplo ruim (não fazer)
"O que é React? A) Uma biblioteca JavaScript B) Um banco de dados C) Um sistema operacional D) Uma linguagem de marcação"
Problemas: distratores absurdos, nível trivial, não mede conhecimento real.

## Exemplo bom
Enunciado: "Um componente chama setCount(count + 1) duas vezes seguidas no mesmo clique, partindo de count = 0. Qual o valor após a renderização?"
A) 2  B) 1 (correta)  C) 0  D) Erro de renderização
Explicação: as duas chamadas leem o mesmo valor de count do render atual, então ambas definem 1. Para somar 2, use a forma de função: setCount(c => c + 1).
Dificuldade 3, Bloom: aplicar, subtópico: estado e atualizações em lote.

## Checklist rápido para evals
1. Exatamente 1 correta? 2. Distratores plausíveis? 3. Dificuldade coerente com a tabela? 4. Sem pistas gramaticais? 5. Explicação correta e curta? 6. Conteúdo atual (sem APIs obsoletas)?
