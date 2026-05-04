#!/bin/sh
set -e

# Aplicar schema do Prisma (idempotente, mas evita delay no startup normal)
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Aplicando schema do Prisma..."
  npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || {
    echo "Aviso: prisma db push falhou (banco pode estar indisponível). Tentando novamente em 5s..."
    sleep 5
    npx prisma db push --skip-generate --accept-data-loss
  }
  echo "Schema aplicado."
fi

exec "$@"
