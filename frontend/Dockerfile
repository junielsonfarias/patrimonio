# Dockerfile para o frontend do Sistema de Gestão Patrimonial
FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache curl

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci && npm cache clean --force

# Copiar código fonte
COPY . .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Alterar propriedade dos arquivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expor porta
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5173 || exit 1

# Comando padrão
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
