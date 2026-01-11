#!/bin/sh
set -e

echo "🚀 Iniciando entrypoint do backend..."

# Gerar Prisma Client (caso não tenha sido gerado)
echo "📦 Gerando Prisma Client..."
npx prisma generate

# Executar migrações do banco de dados
echo "🗄️ Executando migrações do banco de dados..."
npx prisma migrate deploy || echo "⚠️ Aviso: Migrações falharam ou não há migrações pendentes"

# Executar o comando passado como argumento
echo "✅ Iniciando aplicação..."
exec "$@"

