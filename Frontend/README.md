# AçaíDíCasa - Frontend

Frontend do sistema de açaíteria desenvolvido em React com Vite e Tailwind CSS.

## 🚀 Tecnologias Utilizadas
  
- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Superset do JavaScript com tipagem estática  
- **Vite** - Build tool e servidor de desenvolvimento
- **Tailwind CSS** - Framework CSS utilitário  
- **React Router DOM** - Roteamento para aplicações React
- **Axios** - Cliente HTTP para requisições à API  
- **Lucide React** - Biblioteca de ícones  

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Header.tsx      # Cabeçalho da aplicação
│   ├── Footer.tsx      # Rodapé da aplicação
│   └── Loading.tsx     # Componente de loading
├── contexts/           # Contextos React
│   ├── AuthContext.tsx # Contexto de autenticação
│   └── CartContext.tsx # Contexto do carrinho
├── pages/              # Páginas da aplicação
│   ├── Home.tsx        # Página inicial
│   ├── Login.tsx       # Página de login
│   ├── Register.tsx    # Página de registro
│   ├── Products.tsx    # Página de produtos
│   ├── Cart.tsx        # Página do carrinho
│   ├── About.tsx       # Página sobre nós
│   └── Contact.tsx     # Página de contato
├── services/           # Serviços de API
│   └── api.ts          # Cliente da API
├── types/              # Definições de tipos TypeScript
│   └── index.ts        # Tipos principais
├── hooks/              # Hooks customizados
├── utils/              # Utilitários
├── App.tsx             # Componente principal
└── main.tsx            # Ponto de entrada
```

## 🛠️ Instalação e Execução

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório
2. Navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

### Execução

Para executar em modo de desenvolvimento:
```bash
npm run dev
```

Para fazer o build de produção:
```bash
npm run build
```

Para visualizar o build de produção:
```bash
npm run preview
```

## 🎨 Funcionalidades

### ✅ Implementadas

- **Sistema de Autenticação**
  - Login e registro de usuários
  - Gerenciamento de estado de autenticação
  - Proteção de rotas

- **Catálogo de Produtos**
  - Listagem de produtos
  - Filtros e busca
  - Visualização de detalhes

- **Carrinho de Compras**
  - Adicionar/remover produtos
  - Atualizar quantidades
  - Cálculo de totais

- **Interface Responsiva**
  - Design moderno e responsivo
  - Componentes reutilizáveis
  - Experiência mobile-first

- **Integração com Backend**
  - Cliente HTTP configurado
  - Interceptors para autenticação
  - Tratamento de erros

### 🚧 Em Desenvolvimento

- Sistema de pedidos
- Perfil do usuário
- Dashboard administrativo
- Sistema de pagamento

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3001/api
```

### Backend

Este frontend foi desenvolvido para trabalhar com o backend Node.js/Express localizado na pasta `../backend`. Certifique-se de que o backend esteja rodando na porta 3001.

## 📱 Páginas Disponíveis

- **/** - Página inicial com produtos em destaque
- **/login** - Página de login
- **/register** - Página de registro
- **/products** - Catálogo de produtos
- **/cart** - Carrinho de compras
- **/about** - Sobre a empresa
- **/contact** - Informações de contato

## 🎯 Próximos Passos

1. Implementar sistema de pedidos
2. Criar perfil do usuário
3. Desenvolver dashboard administrativo
4. Integrar sistema de pagamento
5. Adicionar testes unitários
6. Implementar PWA

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.