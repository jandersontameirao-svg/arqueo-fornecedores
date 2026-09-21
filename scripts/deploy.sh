#!/usr/bin/env bash
# ============================================================================
# Deploy idempotente do Arqueo Fornecedores na VPS.
# Uso:  bash scripts/deploy.sh
#
# Faz, em ordem e falhando cedo (set -e):
#   1. git pull da branch atual
#   2. pnpm install (dependências novas)
#   3. migração VRM idempotente (cria só tabelas faltantes)
#   4. pnpm build  (inclui typecheck — trava o deploy se houver erro de tipo)
#   5. pm2 restart + save
# ============================================================================
set -euo pipefail

APP_NAME="${APP_NAME:-arqueo-fornecedores}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "==> Deploy de '$APP_NAME' (branch: $BRANCH)"

echo "==> [1/5] git pull"
git pull origin "$BRANCH"

echo "==> [2/5] pnpm install"
pnpm install --frozen-lockfile

echo "==> [3/5] migração idempotente"
if [ -f scripts/run-vrm-migration.mjs ]; then
  node scripts/run-vrm-migration.mjs
else
  echo "    (runner de migração não encontrado — pulando)"
fi

echo "==> [4/5] build (inclui typecheck)"
pnpm build

echo "==> [5/5] pm2 restart + save"
pm2 restart "$APP_NAME"
pm2 save

echo "==> Deploy concluído com sucesso."
