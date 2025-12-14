# Configuração da Validação de Telefone

Este projeto utiliza a **NumLookupAPI** para validar números de telefone durante o cadastro de usuários.

## Como obter a API Key

1. Acesse: https://numlookupapi.com/
2. Crie uma conta gratuita
3. Obtenha sua API Key no painel de controle
4. A API gratuita oferece 100 chamadas por conexão a cada 60 segundos

## Configuração

### Frontend (Vite)

1. Crie um arquivo `.env` na raiz do diretório `Frontend/` (se não existir)
2. Adicione a seguinte variável:

```env
VITE_NUMLOOKUP_API_KEY=sua_api_key_aqui
```

3. Reinicie o servidor de desenvolvimento

**Nota:** Se você não configurar a API key, o sistema usará validação local como fallback (validação de formato e DDD brasileiro).

## Funcionalidades

- ✅ Validação em tempo real durante a digitação
- ✅ Máscara automática de telefone brasileiro: `(00) 00000-0000`
- ✅ Validação com API externa (NumLookupAPI)
- ✅ Fallback para validação local se a API falhar
- ✅ Feedback visual (ícones de validação)
- ✅ Mensagens de erro claras

## Onde é usado

- `Frontend/src/pages/Cadastrar.tsx` - Página de cadastro
- `Frontend/src/pages/Checkout.tsx` - Cadastro durante o checkout

## Validação Local (Fallback)

Se a API não estiver disponível ou não houver API key configurada, o sistema usa validação local que verifica:
- Formato do número (10 ou 11 dígitos)
- DDD válido (códigos de área brasileiros)
- Números não podem ser sequências repetidas

