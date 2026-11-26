#!/usr/bin/env bash
# SessionStart: mostra ao agente o estado do repositório e do harness no início da sessão.
# Só lê git e .harness/last-verify.json; não executa nada do projeto.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

branch=$(git branch --show-current 2>/dev/null || echo "?")
changes=$(git status --short 2>/dev/null | head -n 15)
plan=$(ls -t docs/plans/*.md 2>/dev/null | head -n 1)

echo "## Estado do repositório (harness)"
echo "- Branch: ${branch}"
if [[ -n "$changes" ]]; then
  echo "- Mudanças não commitadas (até 15):"
  sed 's/^/    /' <<<"$changes"
else
  echo "- Árvore limpa."
fi
echo "- Plano mais recente: ${plan:-nenhum em docs/plans/}"
if [[ -f .harness/last-verify.json ]]; then
  ok=$(jq -r '.ok' .harness/last-verify.json 2>/dev/null)
  mode=$(jq -r '.mode' .harness/last-verify.json 2>/dev/null)
  failed=$(jq -r '.failedSteps | join(", ")' .harness/last-verify.json 2>/dev/null)
  when=$(jq -r '.finishedAt' .harness/last-verify.json 2>/dev/null)
  echo "- Último verify (${mode}, ${when}): ok=${ok}${failed:+; falhou em: ${failed}}"
else
  echo "- Último verify: ainda não executado (rode pnpm verify:fast)."
fi
echo "- Definition of Done: seção 'Harness e Definition of Done' do CLAUDE.md."
exit 0
