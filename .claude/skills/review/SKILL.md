---
name: review
description: Revisão completa das mudanças atuais com os agentes revisores (código, segurança e UX), consolidada num único relatório.
argument-hint: "[foco opcional, ex: apenas segurança]"
disable-model-invocation: true
---
Foco extra pedido: $ARGUMENTS

1. Rode `git status` e `git diff --stat` para ver o que mudou. Se não houver mudanças, diga isso e pare.
2. Escolha os revisores pelo que mudou:
   - Sempre: `code-reviewer`.
   - Arquivos em apps/api, supabase/, packages/shared ou qualquer coisa de auth/IA: `security-auditor`.
   - Arquivos em apps/web com .tsx ou .css: `ux-a11y-reviewer`.
3. Chame os revisores escolhidos (podem rodar em paralelo, pois só leem).
4. Consolide num relatório único, sem repetir achados iguais:
   - **Precisa corrigir antes do commit** (bloqueantes, críticos, altos)
   - **Deveria corrigir** (importantes, médios)
   - **Sugestões**
   Cada item com arquivo:linha, problema e correção sugerida, e qual revisor apontou.
5. Termine com o veredito: PRONTO PARA /ship ou CORRIGIR PRIMEIRO.
Não corrija nada nesta skill; só relate.
