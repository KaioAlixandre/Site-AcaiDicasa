# 🚀 Instruções para Executar o Frontend

## Pré-requisitos

1. **Node.js** (versão 18 ou superior)
   - Baixe em: https://nodejs.org/
   - Verifique a instalação: `node --version`

2. **Backend funcionando**
   - Certifique-se de que o backend está rodando na porta 3001
   - Execute: `cd ../backend && npm start`

## Passos para Executar

### 1. Instalar Dependências
```bash
cd frontend
npm install
```

### 2. Executar em Modo de Desenvolvimento
```bash
npm run dev
```

O servidor será iniciado em: `http://localhost:5173`

### 3. Acessar a Aplicação
Abra seu navegador e acesse: `http://localhost:5173`

## 🎯 Funcionalidades Disponíveis

### ✅ Páginas Implementadas
- **/** - Página inicial com produtos em destaque
- **/login** - Sistema de login
- **/register** - Sistema de registro
- **/products** - Catálogo de produtos
- **/cart** - Carrinho de compras
- **/profile** - Perfil do usuário
- **/orders** - Histórico de pedidos
- **/about** - Sobre a empresa
- **/contact** - Informações de contato

### 🔧 Funcionalidades Técnicas
- Sistema de autenticação completo
- Gerenciamento de estado com Context API
- Integração com API do backend
- Design responsivo com Tailwind CSS
- Roteamento com React Router
- Componentes reutilizáveis

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Verificar tipos TypeScript
npm run type-check
```

## 🐛 Solução de Problemas

### Erro de Conexão com Backend
- Verifique se o backend está rodando na porta 3001
- Confirme se não há conflitos de CORS

### Erro de Tailwind CSS
- Execute: `npm install -D tailwindcss postcss autoprefixer`
- Verifique se o arquivo `tailwind.config.js` existe

### Erro de Dependências
- Delete a pasta `node_modules` e `package-lock.json`
- Execute: `npm install`

## 📱 Testando as Funcionalidades

1. **Registro/Login**
   - Acesse `/register` para criar uma conta
   - Use `/login` para fazer login

2. **Navegação**
   - Teste todos os links do menu
   - Verifique a responsividade em diferentes tamanhos de tela

3. **Carrinho**
   - Adicione produtos ao carrinho
   - Teste a atualização de quantidades
   - Verifique o cálculo de totais

4. **Perfil**
   - Acesse `/profile` após fazer login
   - Teste a edição de telefone
   - Adicione endereços

## 🎨 Personalização

### Cores
Edite o arquivo `tailwind.config.js` para personalizar as cores:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Suas cores personalizadas
      }
    }
  }
}
```

### Componentes
Todos os componentes estão em `src/components/` e podem ser facilmente modificados.

## 📞 Suporte

Se encontrar algum problema:
1. Verifique se todas as dependências estão instaladas
2. Confirme se o backend está funcionando
3. Verifique os logs do console do navegador
4. Consulte a documentação do React e Tailwind CSS
