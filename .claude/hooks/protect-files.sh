#!/usr/bin/env bash
# PreToolUse (L0 do harness): bloqueia escrita em arquivos protegidos e comandos perigosos.
# Fonte das regras: CLAUDE.md ("Nunca edite .env*, lockfiles à mão ou migrations já aplicadas").
# Exit 2 = bloqueia a ferramenta e devolve o motivo (stderr) ao agente.
set -uo pipefail

input=$(cat)
tool=$(jq -r '.tool_name // ""' <<<"$input")

block() {
  echo "BLOQUEADO pelo harness (protect-files): $1" >&2
  exit 2
}

case "$tool" in
  Edit|Write|MultiEdit|NotebookEdit)
    file=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // ""' <<<"$input")
    path="${file//\\//}"
    base="${path##*/}"

    case "$base" in
      .env|.env.*) block "$base é arquivo de ambiente; segredos nunca são editados por agente (CLAUDE.md). Peça ao usuário." ;;
      pnpm-lock.yaml) block "o lockfile só muda via 'pnpm install/add/remove', nunca à mão (CLAUDE.md)." ;;
    esac

    case "$path" in
      */.claude/settings.json|*/.claude/settings.local.json|.claude/settings*.json)
        block "configuração do harness (.claude/settings*.json) só é alterada pelo usuário ou com pedido explícito dele." ;;
      */supabase/migrations/*.sql|supabase/migrations/*.sql)
        if [[ -e "$file" ]]; then
          block "migration já existente ($base) não pode ser editada; crie uma migration nova (CLAUDE.md)."
        fi ;;
    esac
    ;;

  Bash)
    cmd=$(jq -r '.tool_input.command // ""' <<<"$input")
    if grep -Eq -- 'git[[:space:]][^|;&]*(--no-verify|--no-gpg-sign)' <<<"$cmd"; then
      block "não pule git hooks (--no-verify); corrija o que o hook apontou."
    fi
    if grep -Eq 'git[[:space:]]+push([^|;&]*)[[:space:]](-f|--force|--force-with-lease)([[:space:]]|$)' <<<"$cmd"; then
      block "push forçado não é permitido para agentes."
    fi
    if grep -Eq '(>|>>|tee[[:space:]]|sed[[:space:]]+-i|rm[[:space:]])[^|;&]*pnpm-lock\.yaml' <<<"$cmd"; then
      block "o lockfile só muda via 'pnpm install/add/remove'."
    fi
    if grep -Eq '(^|[[:space:]/"'\''=<>])\.env(\.[A-Za-z0-9_-]+)?($|[[:space:]"'\''])' <<<"$cmd"; then
      block "o comando referencia um arquivo .env; agentes não leem nem escrevem segredos."
    fi
    ;;
esac

exit 0
