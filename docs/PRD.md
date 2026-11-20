# SkillQuest — PRD

> Status: rascunho v0.2 (2026-11-20) · Projeto de estudo e portfólio · Meta de custo: US$0
>
> v0.2: trilha estilo Duolingo gerada a partir do nivelamento, lição do dia, revisão de erros, conquistas e card público. Os IDs RF-01 a RF-13 foram preservados (a ARCHITECTURE e as rules os citam); os requisitos novos começam em RF-14.

## 1. Visão e problema

Quem estuda uma tecnologia raramente sabe **onde está**. Os cursos começam do zero ou presumem conhecimento, e os simulados não se adaptam à pessoa. O SkillQuest resolve isso em três passos:

1. **Nivelamento:** um quiz adaptativo de múltipla escolha, gerado por IA, estima o nível do usuário em qualquer tecnologia que ele digitar, e por tópico dessa tecnologia.
2. **Trilha personalizada:** a partir do nivelamento, o sistema monta uma trilha estilo Duolingo, com uma unidade por tópico, começando pelas lacunas. Tópicos já dominados aparecem como "testados".
3. **Prática diária:** a lição do dia (a próxima lição da trilha) mais as revisões vencidas (repetição espaçada), com XP, streak, vidas e conquistas. Um modo de revisão de erros permite treinar o que a pessoa errou, sem gastar vidas.

## 2. Personas

| Persona | Objetivo | Dor | Frequência esperada |
|---|---|---|---|
| **Ana, dev júnior** que se prepara para entrevistas | Chegar segura às entrevistas técnicas de React/TypeScript | Não sabe que tópicos ainda não domina; estuda tudo por igual | Diária, 10–15 min, nas semanas antes das entrevistas |
| **Bruno, dev pleno trocando de stack** (Java → Go) | Aproveitar o que já sabe e cobrir só as lacunas | Material introdutório é lento; o avançado presume contexto | 3–4×/semana |
| **Carla, aluna de bootcamp** | Fixar o conteúdo das aulas e medir a evolução | Esquece o que viu há duas semanas; não tem feedback objetivo | Diária, sessões curtas no celular (web responsiva) |

Como a trilha atende cada persona: Ana começa pelos tópicos em que errou mais; Bruno vê os tópicos que já domina marcados como "testados" e pula direto para as lacunas; Carla faz uma lição de 6 perguntas por dia e revê os erros no ônibus, sem medo de perder vidas.

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
| RF-04 | **Quiz de nivelamento adaptativo:** perguntas de múltipla escolha (4 opções, 1 correta), geradas em tempo real, com dificuldade ajustada a cada resposta. Mínimo de 8 e máximo de 20 perguntas. |
| RF-05 | Depois de cada resposta, o usuário vê se acertou e uma explicação curta. |
| RF-06 | **Resultado do nivelamento:** nível geral (Iniciante, Básico, Intermediário, Avançado ou Especialista) e os pontos fortes e fracos por tópico. Ao concluir, a trilha da tecnologia é gerada (RF-14) e o usuário é levado a ela. |
| RF-12 | O usuário pode refazer o nivelamento de uma tecnologia (no máximo 1 vez a cada 7 dias). Ao concluir, a trilha é **recalculada** (RF-17) sem perder progresso. |

### 3.3 Trilha e lições

| ID | Requisito |
|---|---|
| RF-14 | **Trilha gerada a partir do nivelamento:** uma **unidade por tópico** da tecnologia, ordenadas do menor θ por tópico para o maior (lacunas primeiro). Tópicos **dominados** no nivelamento (pelo menos 2 respostas no tópico e θ do tópico ≥ 0,5, ou seja, nível Avançado ou acima) aparecem como **"testados"**: ficam com todas as lições acessíveis, mas não bloqueiam o avanço. |
| RF-15 | **Lição:** cada unidade tem **3 lições** de **6 perguntas** cada, com dificuldade crescente dentro da lição e de uma lição para a outra (ARCHITECTURE §7.2). A dificuldade é calculada no início da lição com o θ atual do tópico. |
| RF-16 | **Desbloqueio sequencial:** a 1ª lição da 1ª unidade não testada começa desbloqueada. A lição seguinte desbloqueia quando a anterior é concluída. A unidade seguinte desbloqueia quando a anterior fica concluída ou testada. O que já foi desbloqueado nunca volta a ser bloqueado. Tentar abrir lição bloqueada devolve `LESSON_LOCKED`. |
| RF-17 | **Conclusão e atualização:** a lição é **concluída** quando o usuário responde as 6 perguntas com **pelo menos 4 acertos**; com menos, ela fica disponível para repetir (com perguntas que ele ainda não viu, quando houver). A unidade é concluída quando as 3 lições estão concluídas. A ordem da trilha só muda quando o usuário refaz o nivelamento: aí as unidades não concluídas são reordenadas pelo novo θ, tópicos que passaram a ser dominados viram "testados", e tópicos que eram "testados" e deixaram de ser dominados voltam a ser unidades normais (continuam acessíveis). Unidades e lições concluídas continuam concluídas. |
| RF-07 | **Prática do dia:** a tela "Hoje" mostra (a) as **revisões vencidas** da repetição espaçada, até 5 por sessão, e (b) a **lição do dia**, que é a próxima lição disponível da trilha. Se a trilha estiver toda concluída, a sessão de revisão é completada até 10 perguntas com perguntas novas dos 2 tópicos mais fracos (reforço). |

### 3.4 Revisão de erros

| ID | Requisito |
|---|---|
| RF-18 | **Revisão de erros:** um modo para praticar as perguntas cuja **última resposta do usuário foi errada** (em qualquer contexto: nivelamento, lição, revisão), por tecnologia, até 10 por sessão, os erros mais recentes primeiro. **Não gasta vidas** (pode ser usado com 0 vidas), dá **metade do XP** de um acerto normal e não dá bônus de sessão. Acertar tira a pergunta da lista; errar a mantém. Não altera o θ. Sem erros pendentes, a api devolve `NO_MISTAKES`. |

### 3.5 Gamificação

| ID | Requisito |
|---|---|
| RF-08 | **XP:** ganho por acerto, com bônus por dificuldade e por completar a sessão (lição ou revisão). Valores em ARCHITECTURE §7.6. |
| RF-09 | **Streak:** dias seguidos com pelo menos uma sessão terminada (lição, revisões do dia ou revisão de erros, com todas as perguntas respondidas), no fuso do usuário. |
| RF-10 | **Vidas:** 5 no máximo; o erro em lição ou em revisão custa 1 vida; regenera 1 vida a cada 4h. Sem vidas, a pessoa pode revisar as explicações e usar a revisão de erros (RF-18). O nivelamento e a revisão de erros não gastam vidas. |
| RF-19 | **Conquistas:** 8 conquistas iniciais com critério objetivo, avaliadas ao fim de cada sessão (lista em §3.7). Cada conquista é desbloqueada uma única vez e aparece na tela de resultado e no perfil. |

### 3.6 Progresso, compartilhamento e demo

| ID | Requisito |
|---|---|
| RF-11 | **Painel de progresso:** tecnologias, nível atual e evolução por tópico, unidades concluídas por tecnologia, XP total, streak e conquistas. |
| RF-20 | **Card público (opt-in):** o usuário pode criar, para uma tecnologia nivelada, um card público com **nome de exibição, tecnologia e nível** (só isso). O link usa um slug aleatório não adivinhável. Nada é público até ele criar o card. |
| RF-21 | **Desativar o card:** o usuário pode desativar o card a qualquer momento; o link passa a devolver "não encontrado". Reativar gera um **slug novo** (o link antigo continua morto). |
| RF-22 | **Página pública do card:** acessível sem login. Nunca expõe e-mail, id do usuário, θ numérico, histórico ou qualquer dado além dos 3 campos do RF-20. O nível mostrado é o atual. |
| RF-23 | **Dica:** em lições, na revisão do "Hoje" e na revisão de erros, o usuário pode pedir uma dica por pergunta, que **elimina 1 alternativa errada**. Não existe no nivelamento. Acerto com dica dá metade do XP, não altera o nível estimado e não gasta vida. |
| RF-13 | **Modo demo** sem IA (perguntas prontas), para mostrar o portfólio sem gastar cota. Cobre nivelamento, trilha, lição, revisão de erros e conquistas. |

### 3.7 Conquistas iniciais (RF-19)

| Slug | Nome | Critério (objetivo e testável) | Avaliada ao fim de |
|---|---|---|---|
| `primeiro-nivelamento` | Ponto de partida | ≥ 1 nivelamento com `status = finished` | nivelamento |
| `poliglota` | Poliglota | nivelamento concluído em ≥ 3 tecnologias distintas | nivelamento |
| `primeira-licao` | Primeiro passo | ≥ 1 lição concluída (≥ 4/6 acertos) | lição |
| `licao-perfeita` | Gabaritou | uma lição terminada com 6/6 acertos | lição |
| `unidade-concluida` | Unidade fechada | ≥ 1 unidade com as 3 lições concluídas (unidade só "testada" não conta) | lição |
| `sequencia-7` | Uma semana firme | `streak_current ≥ 7` | qualquer sessão |
| `xp-1000` | Mil de XP | `xp_total ≥ 1000` | qualquer sessão |
| `caca-erros` | Caça-erros | ≥ 20 acertos acumulados na revisão de erros | revisão de erros |

## 4. Fora do escopo (MVP)

- **Ligas semanais, ranking**, amigos, seguir pessoas e qualquer recurso social além do card público.
- Imagem de pré-visualização (Open Graph) personalizada por card; o link mostra a página, mas sem prévia rica nas redes.
- Editar a trilha à mão, reordenar unidades, criar ou renomear tópicos, ou acrescentar tópicos depois que a tecnologia foi criada.
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
| RNF-02 | **Latência:** p95 de até 4s para gerar uma pergunta. Para o usuário, a próxima pergunta aparece em menos de 1s na maioria dos casos, graças à pré-busca (ver ARCHITECTURE §5 e §7.2). |
| RNF-03 | Toda resposta da IA é validada (schema Zod mais checagens semânticas) antes de ser salva ou mostrada. |
| RNF-04 | O índice da resposta correta **nunca** vai ao cliente antes de o usuário responder. A correção acontece no servidor. |
| RNF-05 | RLS habilitado em todas as tabelas. A chave do Gemini existe só em `apps/api`. |
| RNF-06 | Quando a cota do Gemini acaba, o usuário recebe uma mensagem clara e pode continuar com perguntas já salvas, se houver. A revisão de erros e as revisões vencidas nunca dependem da IA. |
| RNF-07 | Nenhum dado pessoal entra nos prompts. No plano gratuito, o Google pode usar o conteúdo enviado para melhorar os produtos dele. |
| RNF-08 | Acessibilidade: navegável por teclado, contraste AA, opções como `radio` com rótulo; a trilha comunica o estado de cada lição (bloqueada, disponível, concluída, testada) por texto, não só por cor. |
| RNF-09 | **Gerar ou recalcular a trilha não chama a IA** e roda em p95 ≤ 300 ms (é cálculo puro mais algumas escritas). |
| RNF-10 | **Privacidade do card:** a tabela de cards não é legível por clientes; a leitura pública passa só por uma rota da api sem auth, que devolve um DTO com lista fechada de campos. Slug com ≥ 96 bits de aleatoriedade. Nome de exibição do card nunca é preenchido a partir do e-mail e recusa `@`. |
| RNF-11 | **Limite de IA por usuário:** no máximo 100 gerações de pergunta por usuário por dia (configurável), contadas no Postgres (a api é stateless). Acima disso, o sistema usa perguntas salvas ou devolve `RATE_LIMITED`. |

## 6. Métricas

| Métrica | Definição | Meta inicial |
|---|---|---|
| Conclusão do nivelamento | sessões concluídas ÷ iniciadas | ≥ 70% |
| Perguntas até convergir | média de perguntas por nivelamento concluído | ≤ 14 |
| Retenção D1 / D7 | usuários com sessão no dia 1 ou 7 após o cadastro | 40% / 20% |
| Streak mediana | entre usuários ativos na semana | ≥ 3 dias |
| **Conclusão de lição** | sessões de lição terminadas com ≥ 4/6 ÷ sessões de lição iniciadas | ≥ 65% |
| **Abandono de lição** | sessões de lição com status `abandoned` ÷ iniciadas | ≤ 20% |
| **Unidades concluídas por semana** | mediana, entre usuários com ≥ 1 lição na semana | ≥ 1 |
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
| **Limites do plano gratuito** (requisições por minuto e por dia) | Reaproveitar perguntas salvas, limitar por usuário (RNF-11), degradar com aviso, e usar o modo demo e o `MockGenerator` em dev e nos testes. Uma lição nova pode custar até 6 gerações; o reuso entre usuários da mesma tecnologia reduz isso com o tempo. |
| **O modelo `gemini-3.8-flash` muda de nome ou é descontinuado** | O nome do modelo fica na variável de ambiente `GEMINI_MODEL`, e o adaptador de IA fica isolado atrás de uma interface. |
| **Calibração de dificuldade ruim no início** (a dificuldade estimada pela IA é imprecisa) | O IRT recalibra a dificuldade `b` com o uso (ARCHITECTURE §6). |
| **Trilha desmotivadora** (usuário Especialista vê tudo "testado"; iniciante empaca na 1ª unidade) | Unidades testadas continuam jogáveis; a dificuldade da lição acompanha o θ do tópico; lição reprovada pode ser repetida sem limite; com a trilha concluída, a prática vira reforço dos tópicos mais fracos. |
| **Reordenar a trilha confunde o usuário** | A ordem só muda ao refazer o nivelamento (no máximo 1×/7 dias), e nada que foi concluído ou desbloqueado regride. |
| **Vazamento de dados pelo card público** | DTO público com campos fixos validado por schema `.strict()`, tabela sem política RLS para clientes, slug aleatório, nome de exibição informado explicitamente, testes que verificam a ausência de e-mail e id na resposta. |
| **Revisão de erros usada para "farmar" XP sem risco** | XP pela metade, sem bônus de sessão, e a pergunta sai da lista ao ser acertada. |
