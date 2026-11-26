# SkillQuest — PRD

> Status: rascunho v0.3 (2026-11-25) · Projeto de estudo e portfólio · Meta de custo: US$0
>
> **v0.3 (mudança de escopo, [ADR 0004](./ADR/0004-quiz-sem-trilha.md)):** o produto deixa de ter **trilha, unidades e lições**. O fluxo passa a ser: escolher a tecnologia → nivelamento adaptativo (10 a 20 perguntas) → **prática livre de 5 perguntas** geradas pela IA → ao fim de cada prática, um **popup "Como foi?"** (Fácil / Na medida / Difícil) que ajusta a dificuldade da próxima. RF-14 a RF-17 e a "lição do dia" do RF-07 foram removidos; os IDs continuam na tabela, marcados como removidos. O RF-24 (popup) é novo.
>
> v0.2: trilha estilo Duolingo gerada a partir do nivelamento, lição do dia, revisão de erros, conquistas e card público. Os IDs RF-01 a RF-13 foram preservados (a ARCHITECTURE e as rules os citam); os requisitos novos começaram em RF-14.

## 1. Visão e problema

Quem estuda uma tecnologia raramente sabe **onde está**. Os cursos começam do zero ou presumem conhecimento, e os simulados não se adaptam à pessoa. O SkillQuest resolve isso em três passos:

1. **Nivelamento:** um quiz adaptativo de múltipla escolha, gerado por IA, estima o nível do usuário em qualquer tecnologia que ele digitar, e por tópico dessa tecnologia.
2. **Prática:** sessões curtas de 5 perguntas de múltipla escolha, geradas pela IA na dificuldade do nível do usuário, que ele faz quantas vezes quiser. Ao fim de cada prática, o usuário diz se foi fácil, na medida ou difícil, e a próxima prática se ajusta.
3. **Hábito e retenção:** repetição espaçada (as perguntas vencidas voltam na prática), XP, streak, vidas e conquistas. Um modo de revisão de erros permite treinar o que a pessoa errou, sem gastar vidas.

## 2. Personas

| Persona | Objetivo | Dor | Frequência esperada |
|---|---|---|---|
| **Ana, dev júnior** que se prepara para entrevistas | Chegar segura às entrevistas técnicas de React/TypeScript | Não sabe que tópicos ainda não domina; estuda tudo por igual | Diária, 10–15 min, nas semanas antes das entrevistas |
| **Bruno, dev pleno trocando de stack** (Java → Go) | Aproveitar o que já sabe e cobrir só as lacunas | Material introdutório é lento; o avançado presume contexto | 3–4×/semana |
| **Carla, aluna de bootcamp** | Fixar o conteúdo das aulas e medir a evolução | Esquece o que viu há duas semanas; não tem feedback objetivo | Diária, sessões curtas no celular (web responsiva) |

Como o produto atende cada persona: Ana vê no resultado do nivelamento os tópicos fortes e fracos, e as perguntas novas da prática focam nos 2 tópicos mais fracos; quando acha fácil demais, responde "Fácil" no popup e a próxima prática sobe de dificuldade. Bruno é nivelado direto no nível dele, então a prática não começa pelo básico. Carla faz uma prática de 5 perguntas por dia (o que mantém o streak), as perguntas que ela esqueceria voltam pela repetição espaçada, e ela revê os erros no ônibus, sem medo de perder vidas.

## 3. Escopo do MVP

### 3.1 Conta e catálogo

| ID | Requisito |
|---|---|
| RF-01 | Cadastro e login com Supabase Auth (e-mail com magic link e GitHub OAuth). |
| RF-02 | O usuário digita **qualquer tecnologia** em texto livre. O sistema normaliza o nome (por exemplo "reactjs" → `react`) e recusa o que não for tecnologia. |
| RF-03 | Para uma tecnologia nova, o sistema gera e salva uma árvore de **5 a 8 tópicos**. |

### 3.2 Nivelamento

| ID | Requisito |
|---|---|
| RF-04 | **Quiz de nivelamento adaptativo:** perguntas de múltipla escolha (4 opções, 1 correta), geradas em tempo real. A dificuldade sobe depois de um acerto e desce depois de um erro. **Mínimo de 10 e máximo de 20 perguntas**: a partir da 10ª resposta, o quiz para quando o erro-padrão da estimativa fica abaixo de 0,6 (ARCHITECTURE §6); na 20ª, para de qualquer jeito. |
| RF-05 | Depois de cada resposta, o usuário vê se acertou e uma explicação curta. |
| RF-06 | **Resultado do nivelamento:** nível geral (Iniciante, Básico, Intermediário, Avançado ou Especialista) e os pontos fortes e fracos por tópico. Ao concluir, o usuário é levado à **prática** da tecnologia (RF-07). |
| RF-12 | O usuário pode refazer o nivelamento de uma tecnologia (no máximo 1 vez a cada 7 dias). O novo resultado passa a ser o nível atual e a base da dificuldade das próximas práticas, e o ajuste do popup (RF-24) volta a 0. |

### 3.3 Prática

| ID | Requisito |
|---|---|
| RF-14 | Removido na v0.3 (ADR 0004). Era: trilha gerada a partir do nivelamento, com uma unidade por tópico. |
| RF-15 | Removido na v0.3 (ADR 0004). Era: lições de 6 perguntas, 3 por unidade. |
| RF-16 | Removido na v0.3 (ADR 0004). Era: desbloqueio sequencial de lições e unidades (`LESSON_LOCKED`). |
| RF-17 | Removido na v0.3 (ADR 0004). Era: conclusão de lição (≥ 4/6) e recálculo da trilha. |
| RF-07 | **Prática de 5 perguntas:** depois de nivelado numa tecnologia, o usuário pode iniciar uma prática dela **quantas vezes quiser**. Cada prática tem **5 perguntas** de múltipla escolha (4 opções, 1 correta), com feedback e explicação depois de cada resposta (como no RF-05). **Composição:** até **2** perguntas vêm das revisões vencidas da repetição espaçada (as mais atrasadas primeiro) e as demais (3 a 5) são novas; com mais de 2 vencidas, as que sobram ficam para as próximas práticas. As perguntas novas são geradas pela IA (ou reaproveitadas do banco), alternando entre os **2 tópicos de menor nível** do usuário, numa dificuldade fixa para a sessão, calculada no início a partir do nível atual e do ajuste do popup (RF-24). Há **uma prática ativa por tecnologia**: sair e voltar retoma a mesma prática; uma prática sem resposta por mais de 24h é abandonada. Iniciar uma prática com 0 vidas devolve `NO_LIVES`. **Meta diária:** é cumprida pela 1ª sessão terminada no dia, seja uma prática ou uma revisão de erros (RF-18). |
| RF-24 | **Popup "Como foi?":** ao fim de **cada** prática (5 respostas), aparece um popup com a pergunta "Como foi?" e 3 opções: **Fácil** (+1 na dificuldade das próximas práticas), **Na medida** (mantém) e **Difícil** (−1). O ajuste acumula entre práticas, de −2 a +2, e a dificuldade final continua limitada a 1–5. Ele vale por usuário e tecnologia, é separado do nível (não altera o nível estimado nem o card) e volta a 0 quando o usuário refaz o nivelamento (RF-12). Cada prática aceita uma resposta só. O usuário pode fechar o popup sem responder (Esc ou "fechar"): isso equivale a "Na medida" e não grava nada. |

### 3.4 Revisão de erros

| ID | Requisito |
|---|---|
| RF-18 | **Revisão de erros:** um modo para praticar as perguntas cuja **última resposta do usuário foi errada** (em qualquer contexto: nivelamento, prática, revisão de erros), por tecnologia, até 10 por sessão, os erros mais recentes primeiro. **Não gasta vidas** (pode ser usado com 0 vidas), dá **metade do XP** de um acerto normal e não dá bônus de sessão. Acertar tira a pergunta da lista; errar a mantém. Não altera o θ. Não tem o popup do RF-24. Terminar uma revisão de erros cumpre a meta diária e conta para o streak. Sem erros pendentes, a api devolve `NO_MISTAKES`. |

### 3.5 Gamificação

| ID | Requisito |
|---|---|
| RF-08 | **XP:** ganho por acerto, com bônus por dificuldade, e **+20 XP ao terminar a prática** (5 respostas), qualquer que seja o número de acertos. Valores em ARCHITECTURE §7.6. |
| RF-09 | **Streak:** dias seguidos com pelo menos uma sessão terminada (prática ou revisão de erros, com todas as perguntas respondidas), no fuso do usuário. |
| RF-10 | **Vidas:** 5 no máximo; o erro na prática custa 1 vida; regenera 1 vida a cada 4h. Com 0 vidas não dá para iniciar nem responder uma prática; a pessoa pode revisar as explicações e usar a revisão de erros (RF-18). O nivelamento e a revisão de erros não gastam vidas. |
| RF-19 | **Conquistas:** 8 conquistas iniciais com critério objetivo, avaliadas ao fim de cada sessão (lista em §3.7). Cada conquista é desbloqueada uma única vez e aparece na tela de resultado e no perfil. |

### 3.6 Progresso, compartilhamento e demo

| ID | Requisito |
|---|---|
| RF-11 | **Painel de progresso:** tecnologias, nível atual e evolução por tópico, XP total, streak e conquistas. |
| RF-20 | **Card público (opt-in):** o usuário pode criar, para uma tecnologia nivelada, um card público com **nome de exibição, tecnologia e nível** (só isso). O link usa um slug aleatório não adivinhável. Nada é público até ele criar o card. |
| RF-21 | **Desativar o card:** o usuário pode desativar o card a qualquer momento; o link passa a devolver "não encontrado". Reativar gera um **slug novo** (o link antigo continua morto). |
| RF-22 | **Página pública do card:** acessível sem login. Nunca expõe e-mail, id do usuário, θ numérico, histórico ou qualquer dado além dos 3 campos do RF-20. O nível mostrado é o atual. |
| RF-23 | **Dica:** na prática e na revisão de erros, o usuário pode pedir uma dica por pergunta, que **elimina 1 alternativa errada**. Não existe no nivelamento. Acerto com dica dá metade do XP, não altera o nível estimado e não gasta vida. |
| RF-13 | **Modo demo** sem IA (perguntas prontas), para mostrar o portfólio sem gastar cota. Cobre nivelamento, prática (com o popup do RF-24), revisão de erros e conquistas. |

### 3.7 Conquistas iniciais (RF-19)

| Slug | Nome | Critério (objetivo e testável) | Avaliada ao fim de |
|---|---|---|---|
| `primeiro-nivelamento` | Ponto de partida | ≥ 1 nivelamento com `status = finished` | nivelamento |
| `poliglota` | Poliglota | nivelamento concluído em ≥ 3 tecnologias distintas | nivelamento |
| `primeira-pratica` | Primeiro passo | ≥ 1 prática terminada (5 de 5 respondidas) | prática |
| `pratica-perfeita` | Gabaritou | uma prática terminada com 5/5 acertos | prática |
| `pratica-10` | Pegando o ritmo | ≥ 10 práticas terminadas (em qualquer tecnologia) | prática |
| `sequencia-7` | Uma semana firme | `streak_current ≥ 7` | qualquer sessão |
| `xp-1000` | Mil de XP | `xp_total ≥ 1000` | qualquer sessão |
| `caca-erros` | Caça-erros | ≥ 20 acertos acumulados na revisão de erros | revisão de erros |

As conquistas `primeira-licao`, `licao-perfeita` e `unidade-concluida` foram removidas na v0.3 (ADR 0004) e substituídas pelas 3 de prática.

## 4. Fora do escopo (MVP)

- **Trilha, unidades, lições e desbloqueio sequencial** (removidos na v0.3, ADR 0004).
- **Ligas semanais, ranking**, amigos, seguir pessoas e qualquer recurso social além do card público.
- Imagem de pré-visualização (Open Graph) personalizada por card; o link mostra a página, mas sem prévia rica nas redes.
- Escolher à mão o tópico ou a dificuldade de uma prática (o ajuste é só pelo popup do RF-24), criar ou renomear tópicos, ou acrescentar tópicos depois que a tecnologia foi criada.
- Perguntas abertas, de código executável ou de outro formato além da múltipla escolha.
- Notificações (push, e-mail) e lembretes de streak.
- Proteção de streak (freeze), loja de itens, recompensas por conquista.
- App mobile nativo (a web responsiva basta) e modo offline.
- Pagamento, plano premium e anúncios.
- Interface em outros idiomas: o MVP é só em pt-BR.

## 5. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | **Custo de US$0:** Gemini API no plano gratuito, Supabase no plano free, web e api na Vercel no plano Hobby. |
| RNF-02 | **Latência:** p95 de até 4s para gerar uma pergunta. Para o usuário, a próxima pergunta aparece em menos de 1s na maioria dos casos, graças à pré-busca (ver ARCHITECTURE §5 e §7.3). |
| RNF-03 | Toda resposta da IA é validada (schema Zod mais checagens semânticas) antes de ser salva ou mostrada. |
| RNF-04 | O índice da resposta correta **nunca** vai ao cliente antes de o usuário responder. A correção acontece no servidor. |
| RNF-05 | RLS habilitado em todas as tabelas. A chave do Gemini existe só em `apps/api`. |
| RNF-06 | Quando a cota do Gemini acaba, o usuário recebe uma mensagem clara e pode continuar com perguntas já salvas, se houver. A revisão de erros e as revisões vencidas nunca dependem da IA. |
| RNF-07 | Nenhum dado pessoal entra nos prompts. No plano gratuito, o Google pode usar o conteúdo enviado para melhorar os produtos dele. |
| RNF-08 | Acessibilidade: navegável por teclado, contraste AA, opções como `radio` com rótulo. O popup do RF-24 é um diálogo acessível (foco preso no diálogo, fecha com Esc, as 3 opções com rótulo em texto). |
| RNF-09 | Removido na v0.3 (ADR 0004). Era: gerar ou recalcular a trilha sem IA, em p95 ≤ 300 ms. |
| RNF-10 | **Privacidade do card:** a tabela de cards não é legível por clientes; a leitura pública passa só por uma rota da api sem auth, que devolve um DTO com lista fechada de campos. Slug com ≥ 96 bits de aleatoriedade. Nome de exibição do card nunca é preenchido a partir do e-mail e recusa `@`. |
| RNF-11 | **Limite de IA por usuário:** no máximo 100 gerações de pergunta por usuário por dia (configurável), contadas no Postgres (a api é stateless). Acima disso, o sistema usa perguntas salvas ou devolve `RATE_LIMITED`. Vale também para a prática livre. |

## 6. Métricas

| Métrica | Definição | Meta inicial |
|---|---|---|
| Conclusão do nivelamento | sessões concluídas ÷ iniciadas | ≥ 70% |
| Perguntas até convergir | média de perguntas por nivelamento concluído (mínimo 10) | ≤ 14 |
| Retenção D1 / D7 | usuários com sessão no dia 1 ou 7 após o cadastro | 40% / 20% |
| Streak mediana | entre usuários ativos na semana | ≥ 3 dias |
| **Conclusão da prática** | práticas terminadas (5 respondidas) ÷ práticas iniciadas | acompanhar |
| **Abandono da prática** | práticas com status `abandoned` ÷ iniciadas | ≤ 20% |
| **Práticas por usuário ativo** | mediana de práticas terminadas por semana, entre usuários com ≥ 1 prática na semana | acompanhar |
| **Respostas do popup** | distribuição de Fácil / Na medida / Difícil (RF-24); "Na medida" alto indica dificuldade bem calibrada | acompanhar |
| **Uso da revisão de erros** | usuários ativos na semana com ≥ 1 sessão de revisão de erros ÷ ativos | acompanhar |
| **Uso do card** | usuários com card ativo ÷ usuários com ≥ 1 nivelamento concluído; e visualizações por card ativo | ≥ 10%; acompanhar |
| Respostas da IA rejeitadas | gerações que falham na validação ÷ total | ≤ 5% |
| Latência de geração | p95 de `generateContent` | ≤ 4s |
| Uso da cota do Gemini | requisições por dia ÷ limite do plano gratuito | alerta em 80% |
| Taxa de reuso | perguntas servidas do banco ÷ total servidas | acompanhar; tende a subir |

## 7. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| **Perguntas ruins** (ambíguas, com mais de uma resposta certa, factualmente erradas) | Schema estrito, checagens semânticas, nova tentativa e botão "reportar pergunta". Pergunta com 3 reports sai de circulação (`status = retired`). |
| **Prompt injection** pelo campo livre de tecnologia | Normalizar e limitar o texto (≤ 40 caracteres, charset restrito), mandá-lo delimitado como dado, e fazer uma etapa de classificação ("é uma tecnologia?") antes de gerar os tópicos. |
| **Limites do plano gratuito** (requisições por minuto e por dia), agravados pela prática livre | Reaproveitar perguntas salvas, limitar por usuário (RNF-11), degradar com aviso, e usar o modo demo e o `MockGenerator` em dev e nos testes. Uma prática pode custar até 5 gerações; o reuso entre usuários da mesma tecnologia e as revisões vencidas (que não chamam a IA) reduzem isso. |
| **O modelo `gemini-3.8-flash` muda de nome ou é descontinuado** | O nome do modelo fica na variável de ambiente `GEMINI_MODEL`, e o adaptador de IA fica isolado atrás de uma interface. |
| **Calibração de dificuldade ruim no início** (a dificuldade estimada pela IA é imprecisa) | O IRT recalibra a dificuldade `b` com o uso (ARCHITECTURE §6), e o popup do RF-24 corrige a percepção do usuário prática a prática. |
| **Sem trilha, o usuário perde a noção de progresso** | Nível atual e evolução por tópico no painel (RF-11), XP, streak, conquistas e o card público mostram a evolução. |
| **Popup usado para deixar a prática fácil e "farmar" XP** | O XP por acerto cresce com a dificuldade, então perguntas mais fáceis rendem menos; o θ continua sendo atualizado pelas respostas e o ajuste do popup fica limitado a −2..+2. |
| **Vazamento de dados pelo card público** | DTO público com campos fixos validado por schema `.strict()`, tabela sem política RLS para clientes, slug aleatório, nome de exibição informado explicitamente, testes que verificam a ausência de e-mail e id na resposta. |
| **Revisão de erros usada para "farmar" XP sem risco** | XP pela metade, sem bônus de sessão, e a pergunta sai da lista ao ser acertada. |
