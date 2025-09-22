# Guia de Desenvolvimento

Este documento contém informações importantes para desenvolvedores que trabalham no Sistema de Gestão Patrimonial.

## 🚀 Configuração do Ambiente de Desenvolvimento

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- Git
- Editor de código (VS Code recomendado)

### Extensões Recomendadas para VS Code
- TypeScript Importer
- Prisma
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Auto Rename Tag
- Bracket Pair Colorizer

## 🏗️ Arquitetura do Sistema

### Backend (API)
```
backend/
├── src/
│   ├── controllers/     # Controladores das rotas
│   ├── services/        # Lógica de negócio
│   ├── models/          # Modelos de dados
│   ├── middleware/      # Middlewares do Express
│   ├── routes/          # Definição das rotas
│   ├── utils/           # Utilitários
│   └── config/          # Configurações
├── prisma/              # Schema do banco
└── uploads/             # Arquivos enviados
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/      # Componentes React
│   ├── pages/           # Páginas da aplicação
│   ├── hooks/           # Hooks customizados
│   ├── services/        # Serviços de API
│   ├── stores/          # Estado global (Zustand)
│   ├── types/           # Tipos TypeScript
│   └── utils/           # Utilitários
```

## 🔧 Comandos de Desenvolvimento

### Comandos Principais (Raiz do Projeto)
```bash
# Instalar todas as dependências
npm run install:all

# Executar projeto completo em desenvolvimento
npm run dev

# Executar com Docker
npm run dev:docker

# Build completo
npm run build

# Executar testes
npm run test

# Linting
npm run lint
```

### Backend
```bash
cd backend

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Executar testes
npm test

# Executar linting
npm run lint

# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev

# Popular banco com dados de teste
npm run seed

# Visualizar banco de dados
npx prisma studio
```

### Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Executar testes
npm test

# Executar linting
npm run lint

# Verificar tipos
npm run type-check

# Build para produção
npm run build
```

## 🗄️ Banco de Dados

### Schema Principal
O sistema utiliza PostgreSQL com Prisma ORM. O schema principal está em `backend/src/prisma/schema.prisma`.

### Entidades Principais
- **Secretaria**: Órgãos da prefeitura
- **Funcionario**: Funcionários das secretarias
- **Patrimonio**: Bens patrimoniais
- **Documento**: Documentos anexos aos patrimônios
- **Manutencao**: Histórico de manutenções
- **Transferencia**: Transferências entre secretarias
- **Usuario**: Usuários do sistema
- **LogAtividade**: Log de auditoria

### Migrações
```bash
# Criar nova migração
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações em produção
npx prisma migrate deploy

# Reset do banco (cuidado!)
npx prisma migrate reset
```

## 🔐 Autenticação e Autorização

### Sistema de Roles
- **SUPERVISOR**: Acesso total ao sistema
- **ADMINISTRADOR**: Gestão de secretarias e patrimônios
- **OPERADOR**: Criação e edição de patrimônios
- **CONSULTOR**: Apenas visualização

### JWT Tokens
- **Access Token**: Válido por 8 horas
- **Refresh Token**: Válido por 7 dias
- Renovação automática no frontend

## 📝 Padrões de Código

### TypeScript
- Sempre usar tipos explícitos
- Evitar `any`
- Usar interfaces para objetos
- Usar enums para constantes

### React
- Componentes funcionais
- Hooks para estado e efeitos
- Props tipadas
- Nomes descritivos

### CSS
- Tailwind CSS para estilização
- Classes utilitárias
- Componentes customizados quando necessário
- Design responsivo

## 🧪 Testes

### Backend
- Jest para testes unitários
- Supertest para testes de API
- Cobertura mínima: 80%

### Frontend
- Vitest para testes unitários
- React Testing Library para componentes
- Cobertura mínima: 80%

## 📊 Monitoramento

### Métricas
- Prometheus para coleta
- Grafana para visualização
- Health checks automáticos

### Logs
- Winston para logging
- Estrutura JSON
- Níveis: error, warn, info, debug

## 🚀 Deploy

### Desenvolvimento
```bash
docker-compose up -d
```

### Produção
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Debugging

### Backend
- Logs detalhados em desenvolvimento
- Debugger do VS Code
- Prisma Studio para banco

### Frontend
- React DevTools
- Redux DevTools (Zustand)
- Network tab do browser

## 📚 Recursos Úteis

### Documentação
- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Express.js](https://expressjs.com)

### Ferramentas
- [Postman](https://www.postman.com) - Teste de APIs
- [Insomnia](https://insomnia.rest) - Alternativa ao Postman
- [DBeaver](https://dbeaver.io) - Cliente de banco
- [Figma](https://figma.com) - Design

## 🐛 Troubleshooting

### Problemas Comuns

#### Backend não conecta ao banco
```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps

# Verificar logs
docker-compose logs postgres
```

#### Frontend não carrega
```bash
# Verificar se o backend está rodando
curl http://localhost:3000/health

# Verificar variáveis de ambiente
cat frontend/.env
```

#### Erro de permissão no banco
```bash
# Resetar permissões
docker-compose down
docker-compose up -d postgres
```

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Abra um Pull Request
5. Aguarde revisão

### Padrões de Commit
```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração
test: adiciona testes
chore: tarefas de manutenção
```

## 📞 Suporte

- Issues no GitHub
- Email: dev@sistemapatrimonial.com
- Slack: #patrimonio-dev
