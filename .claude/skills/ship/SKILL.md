---
name: ship
description: Valida, documenta e entrega as mudanças atuais - checagens, changelog, commit em Conventional Commits, push e pull request.
argument-hint: "[mensagem de commit opcional]"
disable-model-invocation: true
---
Mensagem sugerida pelo usuário: $ARGUMENTS

## 1. Checagens (pare no primeiro erro e me mostre)
Rode na raiz: `pnpm typecheck`, `pnpm lint`, `pnpm test`.
Se algum comando ainda não existir no projeto, avise e pule apenas esse.

## 2. Branch
Se estiver na `main`, crie uma branch `feat/<slug>` ou `fix/<slug>` conforme o tipo da mudança.

## 3. Changelog
Acrescente a entrada no topo de CHANGELOG.md (crie o arquivo se não existir), na seção "Não lançado", em português, com uma linha por mudança visível ao usuário.

## 4. Commit
- Use a mensagem que eu passei; se não passei, escreva uma em Conventional Commits (feat:, fix:, refactor:, test:, docs:, chore:) com escopo, ex.: `feat(quiz): nivelamento adaptativo`.
- Corpo do commit: o porquê da mudança em 2 a 4 linhas.
- Nunca inclua .env, segredos ou arquivos gerados.
- Mostre `git diff --staged --stat` e a mensagem, e PEÇA minha confirmação antes de commitar.

## 5. Push e PR
Depois do commit: `git push -u origin <branch>` e `gh pr create` com título igual ao commit e descrição contendo: o que mudou, como testar, screenshots pendentes (se houver UI) e checklist de revisão.
Mostre o link do PR no fim.
