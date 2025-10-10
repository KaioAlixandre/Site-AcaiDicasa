# 📧 Configuração de Email Real - Guia Completo

## 🎯 **GMAIL - Configuração Recomendada**

### **Passo 1: Preparar Conta Gmail**

1. **Acesse sua conta Google**: https://myaccount.google.com/
2. **Vá em "Segurança"** no menu lateral
3. **Habilite "Verificação em duas etapas"** (obrigatório)
4. **Aguarde 24 horas** para a ativação completa

### **Passo 2: Gerar Senha de App**

1. **Volte para "Segurança"**
2. **Procure "Senhas de app"** (aparece só depois da 2FA)
3. **Selecione "Aplicativo" → "Email"**
4. **Digite "Acai di Casa"** como nome
5. **Copie a senha gerada** (16 caracteres)

### **Passo 3: Configurar no Sistema**

Edite o arquivo `.env` no backend:

```env
# Substitua pelos seus dados reais:
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=abcd-efgh-ijkl-mnop
```

### **Passo 4: Reiniciar Servidor**

```bash
cd backend
npm start
```

**Verificação**: Se ver `✅ Configuração de email verificada com sucesso` → Funcionou!

---

## 📮 **Outros Provedores de Email**

### **Outlook/Hotmail:**
```env
EMAIL_USER=seu-email@outlook.com
EMAIL_PASSWORD=sua-senha-normal
```

### **Provedor Personalizado:**
```env
EMAIL_USER=seu-email@seudominio.com
EMAIL_PASSWORD=sua-senha
EMAIL_HOST=smtp.seudominio.com
EMAIL_PORT=587
```

Para provedores personalizados, edite também o `emailService.js`:

```javascript
this.transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

---

## 🔍 **Testando a Configuração**

### **Teste 1: Verificar Logs**
Inicie o backend e veja:
- ✅ `Configuração de email verificada com sucesso` = OK
- ❌ `Erro na configuração de email` = Problema

### **Teste 2: Envio Real**
1. Acesse `/forgot-password`
2. Digite seu email real
3. Verifique sua caixa de entrada
4. **Não deve aparecer código na tela** (modo produção)

### **Teste 3: Email Recebido**
O email deve chegar com:
- ✅ Assunto: "Redefinição de Senha - Açaí di Casa"
- ✅ Código de 6 dígitos destacado
- ✅ Design roxo do Açaí di Casa
- ✅ Tempo de expiração (15 minutos)

---

## ⚠️ **Resolução de Problemas**

### **Erro 535 (Gmail):**
- ✅ Verificação em 2 etapas ativada?
- ✅ Senha de app gerada (não sua senha normal)?
- ✅ Email correto no .env?
- ✅ Aguardou 24h após ativar 2FA?

### **Erro de Conexão:**
```bash
# Teste manualmente:
cd backend
node -e "
const emailService = require('./services/emailService');
emailService.testConnection().then(console.log);
"
```

### **Email não Chega:**
- ✅ Verifique spam/lixo eletrônico
- ✅ Confirme email digitado corretamente
- ✅ Teste com outro email

---

## 🚀 **Migração Automática**

O sistema detecta automaticamente:

**Modo Dev** (atual):
```
⚠️ Email não configurado - usando modo de desenvolvimento
```

**Modo Produção** (após configurar):
```
✅ Configuração de email verificada com sucesso
```

**Zero código alterado** - só configurar o .env!

---

## 📋 **Checklist Final**

- [ ] Verificação em 2 etapas ativada
- [ ] Senha de app gerada
- [ ] .env atualizado com dados reais
- [ ] Servidor reiniciado
- [ ] Log mostra "email verificada com sucesso"
- [ ] Teste real de envio funcionando
- [ ] Email chegando na caixa de entrada

**Status após configuração: 🚀 PRODUÇÃO READY**