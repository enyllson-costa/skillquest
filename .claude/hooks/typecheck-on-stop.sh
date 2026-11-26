#!/usr/bin/env bash
# Stop/SubagentStop (L2 do harness): antes de o agente encerrar, roda 'pnpm verify:fast'
# se houver mudança em código. Falhou → exit 2: o agente continua e corrige.
# Trava anti-loop: no máximo 3 bloqueios seguidos; depois libera e avisa o usuário.
# Fica inativo até existir o script "verify:fast" no package.json da raiz (etapa H1).
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[[ -f package.json ]] || exit 0
jq -e '.scripts["verify:fast"]' package.json >/dev/null 2>&1 || exit 0

mkdir -p .harness
counter=.harness/stop-attempts
log=.harness/verify-fast.log

if [[ -z "$(git status --porcelain -- apps packages supabase scripts e2e 2>/dev/null)" ]]; then
  rm -f "$counter"
  exit 0
fi

attempts=$(cat "$counter" 2>/dev/null || echo 0)
if (( attempts >= 3 )); then
  rm -f "$counter"
  echo '{"systemMessage":"Harness: verify:fast continua falhando após 3 tentativas de correção. Veja .harness/verify-fast.log e decida como seguir."}'
  exit 0
fi

if pnpm -s verify:fast >"$log" 2>&1; then
  rm -f "$counter"
  exit 0
fi

echo $((attempts + 1)) >"$counter"
{
  echo "Harness: 'pnpm verify:fast' falhou (tentativa $((attempts + 1))/3). Corrija antes de encerrar."
  echo "Últimas linhas de .harness/verify-fast.log:"
  tail -n 60 "$log"
} >&2
exit 2
