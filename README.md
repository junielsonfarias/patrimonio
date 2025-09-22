# Sistema de Gestão Patrimonial

Sistema completo de gestão patrimonial para prefeituras municipais, desenvolvido com tecnologias modernas e foco em segurança, auditoria e transparência pública.

## 🚀 Características Principais

- **Gestão Completa de Patrimônio**: CRUD completo com numeração automática, QR codes e depreciação
- **Controle de Acesso**: Sistema de roles (Supervisor, Administrador, Operador, Consultor)
- **Auditoria Completa**: Log de todas as ações com rastreabilidade
- **Relatórios Avançados**: Relatórios por secretaria, categoria, transferências e depreciação
- **Interface Moderna**: Design responsivo e intuitivo
- **Transparência Pública**: API pública para consulta de patrimônios
- **Monitoramento**: Dashboard com métricas e alertas

## 🛠️ Stack Tecnológica

### Backend
- **Node.js 20** com **TypeScript**
- **Express.js** para API REST
- **Prisma** como ORM
- **PostgreSQL 15** como banco principal
- **Redis 7** para cache e sessões
- **JWT** para autenticação
- **Winston** para logging
- **Zod** para validação

### Frontend
- **React 18** com **TypeScript**
- **Vite** como bundler
- **Tailwind CSS** para estilização
- **React Query** para gerenciamento de estado
- **Zustand** para estado global
- **React Router v6** para roteamento
- **Headless UI** para componentes acessíveis

### Infraestrutura
- **Docker** e **Docker Compose**
- **Nginx** como proxy reverso
- **Prometheus** e **Grafana** para monitoramento

## 📋 Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Git

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
git clone <repository-url>
cd sistema-gestao-patrimonial
```

### 2. Configure as variáveis de ambiente
```bash
# Backend
cp backend/env.example backend/.env
# Edite o arquivo .env com suas configurações

# Frontend
cp frontend/env.example frontend/.env
# Edite o arquivo .env com suas configurações
```

### 3. Execute com Docker Compose
```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Parar os serviços
docker-compose down
```

### 4. Acesse a aplicação
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090

## 👥 Usuários de Teste

Após executar o seed do banco, você pode usar os seguintes usuários:

| Role | Email | Senha |
|------|-------|-------|
| Supervisor | supervisor@prefeitura.gov.br | 123456 |
| Administrador | admin@prefeitura.gov.br | 123456 |
| Operador | operador@prefeitura.gov.br | 123456 |
| Consultor | consultor@prefeitura.gov.br | 123456 |

## 🏗️ Estrutura do Projeto

```
sistema-gestao-patrimonial/
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores
│   │   ├── services/        # Serviços de negócio
│   │   ├── models/          # Modelos de dados
│   │   ├── middleware/      # Middlewares
│   │   ├── routes/          # Rotas da API
│   │   ├── utils/           # Utilitários
│   │   └── config/          # Configurações
│   ├── prisma/              # Schema do banco
│   └── uploads/             # Arquivos enviados
├── frontend/                # Aplicação React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas
│   │   ├── hooks/           # Hooks customizados
│   │   ├── services/        # Serviços de API
│   │   ├── stores/          # Estado global
│   │   ├── types/           # Tipos TypeScript
│   │   └── utils/           # Utilitários
├── nginx/                   # Configuração do Nginx
├── monitoring/              # Configurações de monitoramento
└── docs/                    # Documentação
```

## 🔧 Desenvolvimento

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Banco de Dados
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev

# Popular com dados de teste
npm run seed
```

## 📊 Funcionalidades

### Gestão de Patrimônio
- ✅ Cadastro com numeração automática (YYYYNNNNNNN)
- ✅ Upload de fotos e documentos
- ✅ Geração automática de QR Code
- ✅ Cálculo de depreciação linear
- ✅ Histórico de manutenções
- ✅ Transferências entre secretarias
- ✅ Baixa patrimonial

### Gestão de Usuários
- ✅ Autenticação JWT com refresh token
- ✅ Controle de acesso baseado em roles
- ✅ Gestão de funcionários
- ✅ Log de auditoria completo
- ✅ Sessões com timeout configurável

### Relatórios
- ✅ Relatórios por secretaria
- ✅ Relatórios por categoria
- ✅ Relatório de transferências
- ✅ Relatório de depreciação
- ✅ Export em PDF/Excel/CSV

### Dashboard
- ✅ Indicadores principais
- ✅ Gráficos interativos
- ✅ Estatísticas em tempo real
- ✅ Monitoramento de atividades

## 🔒 Segurança

- Autenticação JWT com refresh tokens
- Controle de acesso baseado em roles
- Validação de entrada com Zod
- Rate limiting
- Logs de auditoria
- Headers de segurança
- Sanitização de dados

## 📈 Monitoramento

- Health checks automáticos
- Métricas com Prometheus
- Dashboards no Grafana
- Logs estruturados
- Alertas configuráveis

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📝 API Documentation

A documentação da API está disponível em `/api/docs` quando o servidor estiver rodando.

### Endpoints Principais

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário
- `POST /api/auth/refresh` - Renovar token

#### Patrimônios
- `GET /api/patrimonio` - Listar patrimônios
- `POST /api/patrimonio` - Criar patrimônio
- `GET /api/patrimonio/:id` - Obter patrimônio
- `PUT /api/patrimonio/:id` - Atualizar patrimônio
- `DELETE /api/patrimonio/:id` - Excluir patrimônio

#### Secretarias
- `GET /api/secretarias` - Listar secretarias
- `POST /api/secretarias` - Criar secretaria
- `PUT /api/secretarias/:id` - Atualizar secretaria

#### Funcionários
- `GET /api/funcionarios` - Listar funcionários
- `POST /api/funcionarios` - Criar funcionário
- `PUT /api/funcionarios/:id` - Atualizar funcionário

## 🚀 Deploy

### Produção
```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Variáveis de Ambiente de Produção
- Configure `DATABASE_URL` com sua instância PostgreSQL
- Configure `REDIS_URL` com sua instância Redis
- Configure `JWT_SECRET` com uma chave segura
- Configure certificados SSL para HTTPS

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através de:
- Email: suporte@sistemapatrimonial.com
- Issues: [GitHub Issues](https://github.com/seu-usuario/sistema-gestao-patrimonial/issues)

## 🎯 Roadmap

- [ ] App mobile com React Native
- [ ] App desktop com Electron
- [ ] Sincronização offline
- [ ] Integração com sistemas contábeis
- [ ] API de dados abertos
- [ ] Notificações por email
- [ ] Backup automático na nuvem
- [ ] Integração com sistemas de compras

---

Desenvolvido com ❤️ para prefeituras municipais
