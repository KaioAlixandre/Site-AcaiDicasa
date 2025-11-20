# 🐳 Dockerização - Açaí DiCasa

Este projeto está completamente dockerizado e pronto para deploy em produção.

## 📋 Pré-requisitos

- Docker instalado (versão 20.10 ou superior)
- Docker Compose instalado (versão 1.29 ou superior)

## 🚀 Como Executar

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e preencha as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:
- `JWT_SECRET`: Segredo para tokens JWT (use algo seguro)
- `zapApiToken`: Token da sua conta Z-API
- `zapApiInstance`: ID da instância Z-API
- `zapApiClientToken`: Token do cliente Z-API

### 2. Iniciar os Containers

Para iniciar toda a aplicação (banco de dados, backend e frontend):

```bash
docker-compose up -d
```

Para ver os logs:

```bash
docker-compose logs -f
```

### 3. Acessar a Aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Banco de Dados**: localhost:3306

### 4. Parar os Containers

```bash
docker-compose down
```

Para parar e remover volumes (limpa o banco de dados):

```bash
docker-compose down -v
```

## 🏗️ Estrutura do Docker

### Serviços

1. **db (MySQL 8.0)**
   - Porta: 3306
   - Banco de dados: acai_db
   - Usuário: acai_user
   - Volume persistente para dados

2. **backend (Node.js)**
   - Porta: 3001
   - Executa migrações Prisma automaticamente
   - Volume para uploads

3. **frontend (React + Nginx)**
   - Porta: 5173 (mapeado para 80 interno)
   - Build otimizado para produção
   - Proxy reverso para API

### Volumes

- `mysql_data`: Dados persistentes do MySQL
- `./backend/uploads`: Arquivos de upload (imagens, etc)

## 🔧 Comandos Úteis

### Reconstruir os Containers

```bash
docker-compose up -d --build
```

### Executar Migrações Manualmente

```bash
docker-compose exec backend npx prisma migrate deploy
```

### Acessar Shell do Container

Backend:
```bash
docker-compose exec backend sh
```

Banco de Dados:
```bash
docker-compose exec db mysql -u acai_user -p acai_db
```

### Ver Logs de um Serviço Específico

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Resetar Banco de Dados

```bash
docker-compose exec backend npx prisma migrate reset --force
```

## 🌐 Deploy em Produção

### 1. Servidor com Docker

```bash
# Clone o repositório
git clone <seu-repo>
cd Site-AcaiDicasa

# Configure as variáveis de ambiente
cp .env.example .env
nano .env

# Inicie os containers
docker-compose up -d

# Verifique o status
docker-compose ps
```

### 2. Nginx Reverso (Opcional)

Para usar domínio personalizado, configure um Nginx na máquina host:

```nginx
server {
    listen 80;
    server_name seudominio.com.br;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. SSL com Certbot (HTTPS)

```bash
sudo certbot --nginx -d seudominio.com.br
```

## 🔒 Segurança

- ✅ Senhas em variáveis de ambiente
- ✅ JWT_SECRET único e forte
- ✅ Banco de dados isolado na rede Docker
- ✅ Usuário MySQL não-root
- ✅ Volumes com permissões adequadas

## 📊 Monitoramento

### Verificar Saúde dos Containers

```bash
docker-compose ps
```

### Estatísticas de Uso

```bash
docker stats
```

### Espaço em Disco

```bash
docker system df
```

## 🐛 Troubleshooting

### Container não inicia

```bash
docker-compose logs <nome-do-serviço>
```

### Limpar Tudo e Recomeçar

```bash
docker-compose down -v
docker-compose up -d --build
```

### Erro de Migração do Prisma

```bash
docker-compose exec backend npx prisma migrate reset --force
docker-compose restart backend
```

### Banco de Dados não Conecta

```bash
# Verificar se o MySQL está healthy
docker-compose ps

# Ver logs do banco
docker-compose logs db

# Testar conexão
docker-compose exec db mysqladmin ping -h localhost
```

## 📦 Backup e Restore

### Backup do Banco de Dados

```bash
docker-compose exec db mysqldump -u acai_user -p acai_db > backup.sql
```

### Restore do Banco de Dados

```bash
docker-compose exec -T db mysql -u acai_user -p acai_db < backup.sql
```

## 🎯 Performance

- Multi-stage builds para imagens menores
- Nginx com compressão Gzip
- Cache de assets estáticos
- Health checks para garantir disponibilidade
- Restart automático dos containers

## 📝 Notas

- O frontend faz proxy das requisições `/api` para o backend
- As migrações do Prisma são executadas automaticamente na inicialização
- Os uploads são persistidos em volume Docker
- O banco de dados tem volume persistente
