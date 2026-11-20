# SkillQuest — PRD

> Status: rascunho v0.1 (2026-11-19) · Projeto de estudo e portfólio · Meta de custo: US$0

## 1. Visão e problema

Quem estuda uma tecnologia raramente sabe **onde está**. Os cursos começam do zero ou presumem conhecimento, e os simulados não se adaptam à pessoa. O SkillQuest resolve isso em dois passos:

1. **Nivelamento:** um quiz adaptativo de múltipla escolha, gerado por IA, estima o nível do usuário em qualquer tecnologia que ele digitar, e por tópico dessa tecnologia.
2. **Prática diária:** sessões curtas no estilo Duolingo (XP, streak, vidas), focadas nos tópicos fracos e na revisão espaçada do que ele errou.

## 2. Personas

| Persona | Objetivo | Dor | Frequência esperada |
|---|---|---|---|
| **Ana, dev júnior** que se prepara para entrevistas | Chegar segura às entrevistas técnicas de React/TypeScript | Não sabe que tópicos ainda não domina; estuda tudo por igual | Diária, 10–15 min, nas semanas antes das entrevistas |
| **Bruno, dev pleno trocando de stack** (Java → Go) | Aproveitar o que já sabe e cobrir só as lacunas | Material introdutório é lento; o avançado presume contexto | 3–4×/semana |
| **Carla, aluna de bootcamp** | Fixar o conteúdo das aulas e medir a evolução | Esquece o que viu há duas semanas; não tem feedback objetivo | Diária, sessões curtas no celular (web responsiva) |

## 3. Escopo do MVP

| ID | Requisito |
|---|---|
| RF-01 | Cadastro e login com Supabase Auth (e-mail com magic link e GitHub OAuth). |
| RF-02 | O usuário digita **qualquer tecnologia** em texto livre. O sistema normaliza o nome (por exemplo "reactjs" → `react`) e recusa o que não for tecnologia. |
| RF-03 | Para uma tecnologia nova, o sistema gera e salva uma árvore de **5 a 8 tópicos**. |
| RF-04 | **Quiz de nivelamento adaptativo:** perguntas de múltipla escolha (4 opções, 1 correta), geradas em tempo real, com dificuldade ajustada a cada resposta. Mínimo de 8 e máximo de 20 perguntas. |
| RF-05 | Depois de cada resposta, o usuário vê se acertou e uma explicação curta. |
| RF-06 | **Resultado do nivelamento:** nível geral (Iniciante, Básico, Intermediário, Avançado ou Especialista) e os pontos fortes e fracos por tópico. |
| RF-07 | **Prática diária:** sessão de cerca de 10 perguntas que mistura as revisões vencidas (repetição espaçada) com perguntas novas dos tópicos mais fracos. |
| RF-08 | **XP:** ganho por acerto, com bônus por dificuldade e por completar a sessão. |
| RF-09 | **Streak:** dias seguidos com pelo menos uma sessão completa, no fuso do usuário. |
| RF-10 | **Vidas:** 5 no máximo; o erro na prática custa 1 vida; regenera 1 vida a cada 4h. Sem vidas, a pessoa só pode revisar as explicações. O nivelamento não gasta vidas. |
| RF-11 | **Painel de progresso:** tecnologias, nível atual e evolução por tópico, XP total e streak. |
| RF-12 | O usuário pode refazer o nivelamento de uma tecnologia (no máximo 1 vez a cada 7 dias). |
| RF-13 | **Modo demo** sem IA (perguntas prontas), para mostrar o portfólio sem gastar cota. |

## 4. Fora do escopo (MVP)

- Ranking, amigos e qualquer recurso social.
- Perguntas abertas, de código executável ou de outro formato além da múltipla escolha.
- App mobile nativo (a web responsiva basta).
- Pagamento, plano premium e anúncios.
- Interface em outros idiomas: o MVP é só em pt-BR.

## 5. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | **Custo de US$0:** Gemini API no plano gratuito, Supabase no plano free, web e api na Vercel no plano Hobby. |
| RNF-02 | **Latência:** p95 de até 4s para gerar uma pergunta. Para o usuário, a próxima pergunta aparece em menos de 1s na maioria dos casos, graças à pré-busca (ver ARCHITECTURE §5). |
| RNF-03 | Toda resposta da IA é validada (schema Zod mais checagens semânticas) antes de ser salva ou mostrada. |
| RNF-04 | O índice da resposta correta **nunca** vai ao cliente antes de o usuário responder. A correção acontece no servidor. |
| RNF-05 | RLS habilitado em todas as tabelas. A chave do Gemini existe só em `apps/api`. |
| RNF-06 | Quando a cota do Gemini acaba, o usuário recebe uma mensagem clara e pode continuar com perguntas já salvas, se houver. |
| RNF-07 | Nenhum dado pessoal entra nos prompts. No plano gratuito, o Google pode usar o conteúdo enviado para melhorar os produtos dele. |
| RNF-08 | Acessibilidade: navegável por teclado, contraste AA, opções como `radio` com rótulo. |

## 6. Métricas

| Métrica | Definição | Meta inicial |
|---|---|---|
| Conclusão do nivelamento | sessões concluídas ÷ iniciadas | ≥ 70% |
| Perguntas até convergir | média de perguntas por nivelamento concluído | ≤ 14 |
| Retenção D1 / D7 | usuários com sessão no dia 1 ou 7 após o cadastro | 40% / 20% |
| Streak mediana | entre usuários ativos na semana | ≥ 3 dias |
| Respostas da IA rejeitadas | gerações que falham na validação ÷ total | ≤ 5% |
| Latência de geração | p95 de `generateContent` | ≤ 4s |
| Uso da cota do Gemini | requisições por dia ÷ limite do plano gratuito | alerta em 80% |
| Taxa de reuso | perguntas servidas do banco ÷ total servidas | acompanhar; tende a subir |

## 7. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| **Perguntas ruins** (ambíguas, com mais de uma resposta certa, factualmente erradas) | Schema estrito, checagens semânticas, nova tentativa e botão "reportar pergunta". Pergunta com muitos reports sai de circulação. |
| **Prompt injection** pelo campo livre de tecnologia | Normalizar e limitar o texto (≤ 40 caracteres, charset restrito), mandá-lo delimitado como dado, e fazer uma etapa de classificação ("é uma tecnologia?") antes de gerar os tópicos. |
| **Limites do plano gratuito** (requisições por minuto e por dia) | Reaproveitar perguntas salvas, limitar por usuário, degradar com aviso, e usar o modo demo e o `MockGenerator` em dev e nos testes. |
| **O modelo `gemini-3.8-flash` muda de nome ou é descontinuado** | O nome do modelo fica na variável de ambiente `GEMINI_MODEL`, e o adaptador de IA fica isolado atrás de uma interface. |
| **Calibração de dificuldade ruim no início** (a dificuldade estimada pela IA é imprecisa) | O IRT recalibra a dificuldade `b` com o uso (ARCHITECTURE §6). |
