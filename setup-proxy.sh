#!/bin/bash

# Script para configurar o proxy reverso no OpenResty do Integrator Host
# Execute este script após o deploy: ./setup-proxy.sh

echo "🔧 Configurando proxy reverso para acaiteriadicasa.com.br..."

# Criar arquivo de configuração
cat > acaidicasa.conf << 'EOF'
server {
    listen 80;
    server_name acaiteriadicasa.com.br www.acaiteriadicasa.com.br;

    location / {
        proxy_pass http://172.17.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Encontrar o container do OpenResty
OPENRESTY_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i openresty | head -1)

if [ -z "$OPENRESTY_CONTAINER" ]; then
    echo "❌ Container do OpenResty não encontrado!"
    echo "Containers disponíveis:"
    docker ps --format '{{.Names}}'
    exit 1
fi

echo "📦 Container encontrado: $OPENRESTY_CONTAINER"

# Copiar arquivo para o container
echo "📋 Copiando configuração..."
docker cp acaidicasa.conf $OPENRESTY_CONTAINER:/etc/nginx/conf.d/acaidicasa.conf

# Testar configuração
echo "🧪 Testando configuração..."
docker exec $OPENRESTY_CONTAINER nginx -t

if [ $? -eq 0 ]; then
    # Recarregar nginx
    echo "🔄 Recarregando Nginx..."
    docker exec $OPENRESTY_CONTAINER nginx -s reload
    echo "✅ Proxy configurado com sucesso!"
    echo ""
    echo "🌐 Acesse: http://acaiteriadicasa.com.br"
else
    echo "❌ Erro na configuração. Verifique o arquivo acaidicasa.conf"
    exit 1
fi

# Limpar arquivo temporário
rm -f acaidicasa.conf

