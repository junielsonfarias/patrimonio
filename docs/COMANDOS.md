# Comandos do Sistema de Gestão Patrimonial

## 🚀 Como Executar o Projeto

### ⚡ Inicialização Completa (UM COMANDO APENAS)

**Para iniciar tudo de uma vez:**
```bash
npm start
```

Este comando irá:
1. ✅ Instalar todas as dependências
2. ✅ Configurar o banco de dados (SQLite)
3. ✅ Executar migrações
4. ✅ Popular com dados iniciais
5. ✅ Iniciar backend e frontend simultaneamente

### 🖥️ Scripts de Inicialização

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Windows (CMD):**
```cmd
start.bat
```

### Opção 2: Desenvolvimento Local (Manual)

1. **Instalar todas as dependências:**
   ```bash
   npm run install:all
   ```

2. **Configurar banco de dados:**
   ```bash
   npm run db:setup
   ```

3. **Executar o projeto em modo desenvolvimento:**
   ```bash
   npm run dev
   ```
   Este comando irá executar tanto o backend quanto o frontend simultaneamente.

### Opção 2: Desenvolvimento com Docker

```bash
npm run dev:docker
```

### Opção 3: Executar Componentes Separadamente

**Backend apenas:**
```bash
npm run dev:backend
```

**Frontend apenas:**
```bash
npm run dev:frontend
```

## 📋 Comandos Disponíveis

### ⚡ Inicialização
- `npm start` - **INICIA TUDO** (instala, configura e executa)
- `npm run setup` - Instala dependências e configura banco
- `npm run dev` - Executa backend e frontend em modo desenvolvimento

### Desenvolvimento
- `npm run dev:backend` - Executa apenas o backend
- `npm run dev:frontend` - Executa apenas o frontend
- `npm run dev:docker` - Executa tudo com Docker Compose

### Build e Produção
- `npm run build` - Build completo do projeto
- `npm run build:backend` - Build apenas do backend
- `npm run build:frontend` - Build apenas do frontend
- `npm run start` - Executa em modo produção

### Banco de Dados
- `npm run db:setup` - Configura banco completo (generate + migrate + seed)
- `npm run db:reset` - Reseta o banco de dados
- `npm run prisma:generate` - Gera o cliente Prisma
- `npm run prisma:migrate` - Executa migrações do banco
- `npm run prisma:seed` - Popula o banco com dados iniciais

### Testes
- `npm run test` - Executa todos os testes
- `npm run test:backend` - Testes do backend
- `npm run test:frontend` - Testes do frontend

### Linting
- `npm run lint` - Verifica código em todo o projeto
- `npm run lint:fix` - Corrige problemas de lint automaticamente

### Utilitários
- `npm run install:all` - Instala dependências de todos os projetos
- `npm run clean` - Remove node_modules de todos os projetos

## 🔧 Configuração Inicial

### ⚡ Configuração Automática (Recomendado)
```bash
npm start
```
Este comando faz tudo automaticamente!

### 🔧 Configuração Manual

1. **Copiar arquivos de ambiente:**
   ```bash
   cp backend/env.example backend/.env
   cp frontend/env.example frontend/.env
   ```

2. **Configurar variáveis de ambiente** nos arquivos `.env` criados

3. **Configurar banco de dados:**
   ```bash
   npm run db:setup
   ```

## 🌐 URLs de Acesso

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Nginx (Docker):** http://localhost:80
- **Grafana:** http://localhost:3001
- **Prometheus:** http://localhost:9090

## ⚠️ Problemas Comuns

### Erro: "Could not read package.json"
- **Causa:** Comando executado no diretório errado
- **Solução:** Execute os comandos na raiz do projeto (`D:\patrimonio`)

### Erro: "npm rum dev"
- **Causa:** Erro de digitação
- **Solução:** Use `npm run dev` (com "run", não "rum")

### Erro: "Failed to resolve import"
- **Causa:** Dependências não instaladas
- **Solução:** Execute `npm run install:all`

### Erro: "Database not found"
- **Causa:** Banco de dados não configurado
- **Solução:** Execute `npm run db:setup`

### Portas em uso
- **Causa:** Outros serviços usando as mesmas portas
- **Solução:** Pare outros serviços ou altere as portas nos arquivos de configuração

### 🔧 Solução Rápida
Se algo não funcionar, execute:
```bash
npm run clean
npm start
```
