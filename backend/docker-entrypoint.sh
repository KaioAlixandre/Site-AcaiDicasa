#!/bin/sh
set -e

echo "🔄 Aguardando banco de dados..."
sleep 5

echo "🔄 Executando migrações do Prisma..."
npx prisma migrate deploy

echo "✅ Migrações concluídas!"

echo "🚀 Iniciando servidor..."
exec "$@"
