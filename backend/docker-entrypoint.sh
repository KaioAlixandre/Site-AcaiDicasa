#!/bin/sh
set -e

echo "🔄 Aguardando banco de dados..."
sleep 5

echo "🔄 Executando migrações do Prisma..."
npx prisma migrate deploy

echo "🔄 Verificando e aplicando migração de sabores se necessário..."
node check-and-apply-migration.js || echo "⚠️ Verificação de migração concluída"

echo "✅ Migrações concluídas!"

echo "🚀 Iniciando servidor..."
exec "$@"
