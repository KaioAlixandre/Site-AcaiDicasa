# Configuração do Sistema de Recuperação de Senha

## 📧 Configuração de Email

Para que o sistema de recuperação de senha funcione, você precisa configurar o serviço de email no arquivo `.env`.

### Opção 1: Gmail (Recomendado para desenvolvimento)

1. **Habilitar autenticação de 2 fatores** na sua conta Google
2. **Gerar uma senha de app**:
   - Acesse: https://myaccount.google.com/security
   - Vá em "Senhas de app" 
   - Selecione "Email" e gere uma senha
3. **Configurar no .env**:
   ```
   EMAIL_USER=seu-email@gmail.com
   EMAIL_PASSWORD=senha-do-app-gerada
   ```

### Opção 2: Outros provedores

O sistema suporta outros provedores. Atualize o arquivo `backend/services/emailService.js`:

```javascript
this.transporter = nodemailer.createTransporter({
  host: 'smtp.exemplo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## 🔧 Testando o Sistema

1. **Iniciar o backend**: `npm start`
2. **Iniciar o frontend**: `npm run dev`
3. **Acessar**: http://localhost:5173/login
4. **Clicar em**: "Esqueceu sua senha?"

## 📋 Fluxo Completo

1. **Usuário**: Acessa `/forgot-password`
2. **Sistema**: Envia código por email (6 dígitos)
3. **Usuário**: Insere código em `/reset-password`
4. **Sistema**: Valida código e permite nova senha
5. **Redirect**: Volta para login com mensagem de sucesso

## 🛡️ Segurança

- Códigos expiram em 15 minutos
- Códigos são invalidados após uso
- Senhas são hasheadas com bcrypt
- Tokens JWT para autenticação

## 🗄️ Banco de Dados

Tabela `passwordreset` criada automaticamente:
- `id`: Identificador único
- `email`: Email do usuário
- `code`: Código de 6 dígitos
- `createdAt`: Data de criação
- `expiresAt`: Data de expiração
- `used`: Se foi usado ou não

## 🚀 Endpoints da API

- `POST /api/auth/forgot-password`: Solicitar código
- `POST /api/auth/reset-password`: Redefinir senha
- `POST /api/auth/verify-reset-code`: Verificar código (opcional)

## 🎨 Páginas do Frontend

- `/forgot-password`: Solicitar recuperação
- `/reset-password`: Inserir código e nova senha
- `/login`: Login com mensagem de sucesso

## 🔍 Logs

O sistema registra todas as operações:
- ➡️ Requisições recebidas
- ✅ Operações bem-sucedidas  
- ❌ Erros e falhas
- ⚠️ Avisos de segurança