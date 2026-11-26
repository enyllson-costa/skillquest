#!/usr/bin/env bash
# PostToolUse(Edit|Write|MultiEdit) (L1 do harness): formata e faz lint do arquivo editado.
# Fica inativo até o monorepo ter Prettier/ESLint instalados (etapa H1).
# Exit 2 = devolve ao agente os erros de lint que o --fix não resolveu.
set -uo pipefail

input=$(cat)
root="${CLAUDE_PROJECT_DIR:-.}"
file=$(jq -r '.tool_response.filePath // .tool_input.file_path // ""' <<<"$input")
[[ -n "$file" && -f "$file" ]] || exit 0

case "$file" in
  *node_modules*|*/dist/*|*\\dist\\*) exit 0 ;;
esac

cd "$root" || exit 0
prettier="node_modules/.bin/prettier"
eslint="node_modules/.bin/eslint"

case "$file" in
  *.ts|*.mjs|*.js|*.html|*.json|*.css|*.scss|*.yml|*.yaml)
    [[ -x "$prettier" ]] && "$prettier" --write --log-level warn "$file" >/dev/null 2>&1 ;;
  *) exit 0 ;;
esac

case "$file" in
  *.ts|*.mjs|*.js|*.html)
    [[ -x "$eslint" ]] || exit 0
    if ! out=$("$eslint" --fix --max-warnings=0 "$file" 2>&1); then
      echo "ESLint encontrou problemas em $file que o --fix não resolveu. Corrija antes de seguir:" >&2
      echo "$out" | tail -n 40 >&2
      exit 2
    fi ;;
esac

exit 0
