#!/bin/bash

# =============================================================================
# SISTEMA DE GESTÃO PATRIMONIAL - SCRIPT DE INSTALAÇÃO AUTOMÁTICA
# =============================================================================
# Este script instala automaticamente o Sistema de Gestão Patrimonial
# em um servidor Linux (Ubuntu/Debian/CentOS/RHEL)
# 
# Desenvolvido para prefeituras municipais
# Versão: 1.0.0
# =============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="Sistema de Gestão Patrimonial"
APP_DIR="/opt/patrimonio"
SERVICE_USER="patrimonio"
DOMAIN=""
EMAIL=""
DB_PASSWORD=""
JWT_SECRET=""
INSTALL_MODE="production"

# Função para imprimir mensagens coloridas
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    clear
    print_message $CYAN "============================================================================="
    print_message $WHITE "           $APP_NAME - INSTALAÇÃO AUTOMÁTICA"
    print_message $CYAN "============================================================================="
    print_message $YELLOW "Este script irá instalar o sistema completo em seu servidor Linux"
    print_message $YELLOW "Incluindo: Node.js, Docker, PostgreSQL, Redis, Nginx e a aplicação"
    print_message $CYAN "============================================================================="
    echo
}

# Função para verificar se é root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_message $RED "ERRO: Este script não deve ser executado como root!"
        print_message $YELLOW "Execute como usuário normal. O script pedirá senha sudo quando necessário."
        exit 1
    fi
}

# Função para detectar distribuição Linux
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    elif type lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -si)
        VER=$(lsb_release -sr)
    else
        OS=$(uname -s)
        VER=$(uname -r)
    fi
    
    print_message $GREEN "Sistema detectado: $OS $VER"
}

# Função para instalar dependências do sistema
install_system_dependencies() {
    print_message $BLUE "📦 Instalando dependências do sistema..."
    
    # Atualizar sistema
    sudo apt-get update -y
    
    # Instalar dependências básicas
    sudo apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        fail2ban \
        htop \
        nano \
        vim \
        tree \
        jq \
        certbot \
        python3-certbot-nginx
    
    print_message $GREEN "✅ Dependências do sistema instaladas com sucesso!"
}

# Função para instalar Node.js
install_nodejs() {
    print_message $BLUE "📦 Instalando Node.js 20..."
    
    # Remover versões antigas se existirem
    sudo apt-get remove -y nodejs npm
    
    # Instalar Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verificar instalação
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    print_message $GREEN "✅ Node.js $NODE_VERSION e npm $NPM_VERSION instalados!"
}

# Função para instalar Docker
install_docker() {
    print_message $BLUE "🐳 Instalando Docker e Docker Compose..."
    
    # Remover versões antigas
    sudo apt-get remove -y docker docker-engine docker.io containerd runc
    
    # Instalar Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Adicionar usuário ao grupo docker
    sudo usermod -aG docker $USER
    
    # Iniciar e habilitar Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Verificar instalação
    DOCKER_VERSION=$(docker --version)
    COMPOSE_VERSION=$(docker compose version)
    
    print_message $GREEN "✅ $DOCKER_VERSION e $COMPOSE_VERSION instalados!"
    print_message $YELLOW "⚠️  IMPORTANTE: Faça logout e login novamente para usar Docker sem sudo"
}

# Função para configurar firewall
configure_firewall() {
    print_message $BLUE "🔥 Configurando firewall (UFW)..."
    
    # Resetar UFW
    sudo ufw --force reset
    
    # Configurações padrão
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Permitir SSH
    sudo ufw allow ssh
    
    # Permitir HTTP e HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Permitir portas da aplicação (apenas localhost)
    sudo ufw allow from 127.0.0.1 to any port 3000
    sudo ufw allow from 127.0.0.1 to any port 5432
    sudo ufw allow from 127.0.0.1 to any port 6379
    
    # Habilitar UFW
    sudo ufw --force enable
    
    print_message $GREEN "✅ Firewall configurado com sucesso!"
}

# Função para configurar fail2ban
configure_fail2ban() {
    print_message $BLUE "🛡️  Configurando Fail2ban..."
    
    # Configuração básica do fail2ban
    sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF
    
    sudo systemctl restart fail2ban
    sudo systemctl enable fail2ban
    
    print_message $GREEN "✅ Fail2ban configurado com sucesso!"
}

# Função para coletar informações do usuário
collect_user_info() {
    print_message $BLUE "📝 Coletando informações para configuração..."
    echo
    
    # Nome do domínio
    while [[ -z "$DOMAIN" ]]; do
        read -p "🌐 Digite o domínio do seu servidor (ex: patrimonio.prefeitura.gov.br): " DOMAIN
        if [[ -z "$DOMAIN" ]]; then
            print_message $RED "❌ Domínio é obrigatório!"
        fi
    done
    
    # Email para certificados SSL
    while [[ -z "$EMAIL" ]]; do
        read -p "📧 Digite seu email para certificados SSL: " EMAIL
        if [[ -z "$EMAIL" ]]; then
            print_message $RED "❌ Email é obrigatório!"
        fi
    done
    
    # Senha do banco de dados
    while [[ -z "$DB_PASSWORD" ]]; do
        read -s -p "🔐 Digite uma senha forte para o banco de dados: " DB_PASSWORD
        echo
        if [[ ${#DB_PASSWORD} -lt 8 ]]; then
            print_message $RED "❌ Senha deve ter pelo menos 8 caracteres!"
            DB_PASSWORD=""
        fi
    done
    
    # JWT Secret
    JWT_SECRET=$(openssl rand -base64 64)
    
    print_message $GREEN "✅ Informações coletadas com sucesso!"
}

# Função para criar usuário do sistema
create_system_user() {
    print_message $BLUE "👤 Criando usuário do sistema..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        sudo useradd -r -s /bin/false -d $APP_DIR $SERVICE_USER
        print_message $GREEN "✅ Usuário $SERVICE_USER criado!"
    else
        print_message $YELLOW "⚠️  Usuário $SERVICE_USER já existe!"
    fi
}

# Função para criar diretórios
create_directories() {
    print_message $BLUE "📁 Criando estrutura de diretórios..."
    
    sudo mkdir -p $APP_DIR/{data,logs,backups,ssl}
    sudo mkdir -p $APP_DIR/data/{postgres,redis,uploads}
    sudo mkdir -p $APP_DIR/logs/{app,nginx}
    
    # Definir permissões
    sudo chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
    sudo chmod -R 755 $APP_DIR
    
    print_message $GREEN "✅ Diretórios criados com sucesso!"
}

# Função para baixar e configurar aplicação
setup_application() {
    print_message $BLUE "📥 Configurando aplicação..."
    
    # Criar diretório temporário
    TEMP_DIR=$(mktemp -d)
    cd $TEMP_DIR
    
    # Baixar código do repositório GitHub
    git clone https://github.com/junielsonfarias/patrimonio.git /opt/patrimonio
    
    # Verificar se o clone foi bem-sucedido
    if [[ ! -d "/opt/patrimonio" ]]; then
        print_message $RED "❌ Erro ao baixar código do repositório!"
        exit 1
    fi
    
    # Definir permissões
    sudo chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
    sudo chmod +x $APP_DIR/install.sh
    
    # Limpar diretório temporário
    cd /
    rm -rf $TEMP_DIR
    
    print_message $GREEN "✅ Aplicação configurada com sucesso!"
}

# Função para configurar variáveis de ambiente
configure_environment() {
    print_message $BLUE "⚙️  Configurando variáveis de ambiente..."
    
    # Backend .env
    sudo tee $APP_DIR/backend/.env > /dev/null <<EOF
# Configurações do Banco de Dados
DATABASE_URL="postgresql://patrimonio_user:${DB_PASSWORD}@postgres:5432/patrimonio_db?schema=public"

# Configurações do Redis
REDIS_URL="redis://redis:6379"

# Configurações JWT
JWT_SECRET="${JWT_SECRET}"
JWT_EXPIRES_IN="8h"
JWT_REFRESH_SECRET="${JWT_SECRET}_refresh"
JWT_REFRESH_EXPIRES_IN="7d"

# Configurações do Servidor
PORT=3000
NODE_ENV="production"

# Configurações de Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

# Configurações de Segurança
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de Log
LOG_LEVEL="info"
LOG_FILE="/app/logs/app.log"

# Configurações de Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=90

# Configurações de Monitoramento
HEALTH_CHECK_INTERVAL=30000
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
EOF

    # Frontend .env
    sudo tee $APP_DIR/frontend/.env > /dev/null <<EOF
VITE_API_URL=https://${DOMAIN}/api
VITE_APP_NAME=Sistema de Gestão Patrimonial
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
EOF

    # Definir permissões
    sudo chown $SERVICE_USER:$SERVICE_USER $APP_DIR/backend/.env
    sudo chown $SERVICE_USER:$SERVICE_USER $APP_DIR/frontend/.env
    sudo chmod 600 $APP_DIR/backend/.env
    sudo chmod 600 $APP_DIR/frontend/.env
    
    print_message $GREEN "✅ Variáveis de ambiente configuradas!"
}

# Função para configurar Docker Compose para produção
configure_docker_compose() {
    print_message $BLUE "🐳 Configurando Docker Compose para produção..."
    
    sudo tee $APP_DIR/docker-compose.prod.yml > /dev/null <<EOF
version: '3.8'

services:
  # Banco de dados PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: patrimonio-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: patrimonio_db
      POSTGRES_USER: patrimonio_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=pt_BR.UTF-8 --lc-ctype=pt_BR.UTF-8"
    volumes:
      - ${APP_DIR}/data/postgres:/var/lib/postgresql/data
      - ${APP_DIR}/backend/scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - patrimonio-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U patrimonio_user -d patrimonio_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis para cache e sessões
  redis:
    image: redis:7-alpine
    container_name: patrimonio-redis
    restart: unless-stopped
    volumes:
      - ${APP_DIR}/data/redis:/data
    networks:
      - patrimonio-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend Node.js
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: patrimonio-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://patrimonio_user:${DB_PASSWORD}@postgres:5432/patrimonio_db?schema=public
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_SECRET}_refresh
      PORT: 3000
    volumes:
      - ${APP_DIR}/data/uploads:/app/uploads
      - ${APP_DIR}/logs/app:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - patrimonio-network
    command: npm run start

  # Frontend React
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: patrimonio-frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: https://${DOMAIN}/api
      VITE_APP_NAME: Sistema de Gestão Patrimonial
    networks:
      - patrimonio-network
    command: npm run build && npm run preview -- --host 0.0.0.0 --port 5173

  # Nginx (proxy reverso)
  nginx:
    image: nginx:alpine
    container_name: patrimonio-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ${APP_DIR}/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ${APP_DIR}/ssl:/etc/nginx/ssl
      - ${APP_DIR}/logs/nginx:/var/log/nginx
    depends_on:
      - backend
      - frontend
    networks:
      - patrimonio-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  patrimonio-network:
    driver: bridge
EOF

    sudo chown $SERVICE_USER:$SERVICE_USER $APP_DIR/docker-compose.prod.yml
    
    print_message $GREEN "✅ Docker Compose configurado!"
}

# Função para configurar Nginx
configure_nginx() {
    print_message $BLUE "🌐 Configurando Nginx..."
    
    sudo mkdir -p $APP_DIR/nginx
    
    sudo tee $APP_DIR/nginx/nginx.conf > /dev/null <<EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;
    
    # Upstream servers
    upstream backend {
        server backend:3000;
    }
    
    upstream frontend {
        server frontend:5173;
    }
    
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name ${DOMAIN};
        return 301 https://\$server_name\$request_uri;
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name ${DOMAIN};
        
        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Login rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend/auth/login;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Frontend
        location / {
            proxy_pass http://frontend/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Static files
        location /uploads/ {
            proxy_pass http://backend/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

    sudo chown $SERVICE_USER:$SERVICE_USER $APP_DIR/nginx/nginx.conf
    
    print_message $GREEN "✅ Nginx configurado!"
}

# Função para obter certificado SSL
setup_ssl() {
    print_message $BLUE "🔒 Configurando certificado SSL..."
    
    # Parar nginx temporariamente
    sudo systemctl stop nginx 2>/dev/null || true
    
    # Obter certificado com Let's Encrypt
    sudo certbot certonly --standalone \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN \
        --non-interactive
    
    # Copiar certificados para diretório da aplicação
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/ssl/key.pem
    
    # Definir permissões
    sudo chown $SERVICE_USER:$SERVICE_USER $APP_DIR/ssl/*
    sudo chmod 600 $APP_DIR/ssl/*
    
    # Configurar renovação automática
    echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'docker compose -f $APP_DIR/docker-compose.prod.yml restart nginx'" | sudo crontab -
    
    print_message $GREEN "✅ Certificado SSL configurado!"
}

# Função para construir e iniciar aplicação
build_and_start() {
    print_message $BLUE "🚀 Construindo e iniciando aplicação..."
    
    cd $APP_DIR
    
    # Construir imagens
    sudo -u $SERVICE_USER docker compose -f docker-compose.prod.yml build
    
    # Iniciar serviços
    sudo -u $SERVICE_USER docker compose -f docker-compose.prod.yml up -d
    
    # Aguardar serviços iniciarem
    print_message $YELLOW "⏳ Aguardando serviços iniciarem..."
    sleep 30
    
    # Verificar status
    sudo -u $SERVICE_USER docker compose -f docker-compose.prod.yml ps
    
    print_message $GREEN "✅ Aplicação iniciada com sucesso!"
}

# Função para configurar backup automático
setup_backup() {
    print_message $BLUE "💾 Configurando backup automático..."
    
    sudo tee $APP_DIR/backup.sh > /dev/null <<EOF
#!/bin/bash

# Script de backup do Sistema de Gestão Patrimonial
BACKUP_DIR="${APP_DIR}/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="patrimonio_backup_\$DATE.tar.gz"

# Criar diretório de backup
mkdir -p \$BACKUP_DIR

# Parar aplicação
cd ${APP_DIR}
docker compose -f docker-compose.prod.yml stop

# Backup do banco de dados
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U patrimonio_user patrimonio_db > \$BACKUP_DIR/db_backup_\$DATE.sql

# Backup dos uploads
tar -czf \$BACKUP_DIR/uploads_backup_\$DATE.tar.gz -C ${APP_DIR}/data uploads

# Backup da configuração
tar -czf \$BACKUP_DIR/config_backup_\$DATE.tar.gz -C ${APP_DIR} backend/.env frontend/.env nginx/ ssl/

# Backup completo
tar -czf \$BACKUP_DIR/\$BACKUP_FILE -C \$BACKUP_DIR db_backup_\$DATE.sql uploads_backup_\$DATE.tar.gz config_backup_\$DATE.tar.gz

# Remover backups antigos (manter últimos 7 dias)
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete

# Reiniciar aplicação
docker compose -f docker-compose.prod.yml start

echo "Backup concluído: \$BACKUP_FILE"
EOF

    sudo chmod +x $APP_DIR/backup.sh
    sudo chown $SERVICE_USER:$SERVICE_USER $APP_DIR/backup.sh
    
    # Configurar cron para backup diário às 2h da manhã
    echo "0 2 * * * $APP_DIR/backup.sh >> $APP_DIR/logs/backup.log 2>&1" | sudo crontab -u $SERVICE_USER -
    
    print_message $GREEN "✅ Backup automático configurado!"
}

# Função para configurar monitoramento
setup_monitoring() {
    print_message $BLUE "📊 Configurando monitoramento..."
    
    # Script de health check
    sudo tee $APP_DIR/health-check.sh > /dev/null <<EOF
#!/bin/bash

# Health check do Sistema de Gestão Patrimonial
LOG_FILE="${APP_DIR}/logs/health-check.log"
DATE=\$(date '+%Y-%m-%d %H:%M:%S')

# Verificar se os containers estão rodando
if ! docker compose -f ${APP_DIR}/docker-compose.prod.yml ps | grep -q "Up"; then
    echo "[\$DATE] ERRO: Containers não estão rodando" >> \$LOG_FILE
    # Tentar reiniciar
    docker compose -f ${APP_DIR}/docker-compose.prod.yml restart
    echo "[\$DATE] INFO: Tentativa de reinicialização dos containers" >> \$LOG_FILE
fi

# Verificar conectividade com banco
if ! docker compose -f ${APP_DIR}/docker-compose.prod.yml exec -T postgres pg_isready -U patrimonio_user -d patrimonio_db > /dev/null 2>&1; then
    echo "[\$DATE] ERRO: Banco de dados não está respondendo" >> \$LOG_FILE
fi

# Verificar conectividade com Redis
if ! docker compose -f ${APP_DIR}/docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "[\$DATE] ERRO: Redis não está respondendo" >> \$LOG_FILE
fi

# Verificar espaço em disco
DISK_USAGE=\$(df ${APP_DIR} | tail -1 | awk '{print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 80 ]; then
    echo "[\$DATE] AVISO: Uso de disco alto: \$DISK_USAGE%" >> \$LOG_FILE
fi

echo "[\$DATE] INFO: Health check concluído" >> \$LOG_FILE
EOF

    sudo chmod +x $APP_DIR/health-check.sh
    sudo chown $SERVICE_USER:$SERVICE_USER $APP_DIR/health-check.sh
    
    # Configurar cron para health check a cada 5 minutos
    echo "*/5 * * * * $APP_DIR/health-check.sh" | sudo crontab -u $SERVICE_USER -
    
    print_message $GREEN "✅ Monitoramento configurado!"
}

# Função para criar script de gerenciamento
create_management_script() {
    print_message $BLUE "🛠️  Criando script de gerenciamento..."
    
    sudo tee /usr/local/bin/patrimonio > /dev/null <<EOF
#!/bin/bash

# Script de gerenciamento do Sistema de Gestão Patrimonial
APP_DIR="${APP_DIR}"
SERVICE_USER="${SERVICE_USER}"

case "\$1" in
    start)
        echo "Iniciando Sistema de Gestão Patrimonial..."
        sudo -u \$SERVICE_USER docker compose -f \$APP_DIR/docker-compose.prod.yml up -d
        ;;
    stop)
        echo "Parando Sistema de Gestão Patrimonial..."
        sudo -u \$SERVICE_USER docker compose -f \$APP_DIR/docker-compose.prod.yml down
        ;;
    restart)
        echo "Reiniciando Sistema de Gestão Patrimonial..."
        sudo -u \$SERVICE_USER docker compose -f \$APP_DIR/docker-compose.prod.yml restart
        ;;
    status)
        echo "Status do Sistema de Gestão Patrimonial:"
        sudo -u \$SERVICE_USER docker compose -f \$APP_DIR/docker-compose.prod.yml ps
        ;;
    logs)
        echo "Logs do Sistema de Gestão Patrimonial:"
        sudo -u \$SERVICE_USER docker compose -f \$APP_DIR/docker-compose.prod.yml logs -f
        ;;
    backup)
        echo "Executando backup..."
        sudo -u \$SERVICE_USER \$APP_DIR/backup.sh
        ;;
    update)
        echo "Atualizando Sistema de Gestão Patrimonial..."
        cd \$APP_DIR
        sudo -u \$SERVICE_USER git pull
        sudo -u \$SERVICE_USER docker compose -f docker-compose.prod.yml build
        sudo -u \$SERVICE_USER docker compose -f docker-compose.prod.yml up -d
        ;;
    *)
        echo "Uso: patrimonio {start|stop|restart|status|logs|backup|update}"
        echo ""
        echo "Comandos disponíveis:"
        echo "  start   - Iniciar o sistema"
        echo "  stop    - Parar o sistema"
        echo "  restart - Reiniciar o sistema"
        echo "  status  - Ver status dos serviços"
        echo "  logs    - Ver logs em tempo real"
        echo "  backup  - Executar backup manual"
        echo "  update  - Atualizar sistema"
        exit 1
        ;;
esac
EOF

    sudo chmod +x /usr/local/bin/patrimonio
    
    print_message $GREEN "✅ Script de gerenciamento criado!"
}

# Função para exibir informações finais
show_final_info() {
    print_message $CYAN "============================================================================="
    print_message $WHITE "                    INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
    print_message $CYAN "============================================================================="
    echo
    print_message $GREEN "🎉 O Sistema de Gestão Patrimonial foi instalado com sucesso!"
    echo
    print_message $YELLOW "📋 INFORMAÇÕES IMPORTANTES:"
    echo
    print_message $WHITE "🌐 URL da aplicação: https://$DOMAIN"
    print_message $WHITE "📁 Diretório da aplicação: $APP_DIR"
    print_message $WHITE "👤 Usuário do sistema: $SERVICE_USER"
    echo
    print_message $YELLOW "🔑 USUÁRIOS PADRÃO (após primeiro acesso):"
    print_message $WHITE "   Supervisor: supervisor@prefeitura.gov.br / 123456"
    print_message $WHITE "   Administrador: admin@prefeitura.gov.br / 123456"
    print_message $WHITE "   Operador: operador@prefeitura.gov.br / 123456"
    print_message $WHITE "   Consultor: consultor@prefeitura.gov.br / 123456"
    echo
    print_message $YELLOW "🛠️  COMANDOS DE GERENCIAMENTO:"
    print_message $WHITE "   patrimonio start    - Iniciar sistema"
    print_message $WHITE "   patrimonio stop     - Parar sistema"
    print_message $WHITE "   patrimonio restart  - Reiniciar sistema"
    print_message $WHITE "   patrimonio status   - Ver status"
    print_message $WHITE "   patrimonio logs     - Ver logs"
    print_message $WHITE "   patrimonio backup   - Backup manual"
    print_message $WHITE "   patrimonio update   - Atualizar sistema"
    echo
    print_message $YELLOW "📊 MONITORAMENTO:"
    print_message $WHITE "   Logs da aplicação: $APP_DIR/logs/"
    print_message $WHITE "   Backups: $APP_DIR/backups/"
    print_message $WHITE "   Health checks: $APP_DIR/logs/health-check.log"
    echo
    print_message $YELLOW "🔒 SEGURANÇA:"
    print_message $WHITE "   Firewall configurado (UFW)"
    print_message $WHITE "   Fail2ban ativo"
    print_message $WHITE "   SSL/TLS habilitado"
    print_message $WHITE "   Backup automático diário"
    echo
    print_message $RED "⚠️  IMPORTANTE:"
    print_message $WHITE "   1. Faça logout e login novamente para usar Docker sem sudo"
    print_message $WHITE "   2. Altere as senhas padrão após o primeiro acesso"
    print_message $WHITE "   3. Configure o DNS do domínio para apontar para este servidor"
    print_message $WHITE "   4. Mantenha o sistema atualizado regularmente"
    echo
    print_message $CYAN "============================================================================="
    print_message $GREEN "✅ Instalação finalizada! Acesse https://$DOMAIN para usar o sistema."
    print_message $CYAN "============================================================================="
}

# Função principal
main() {
    print_header
    check_root
    detect_os
    
    print_message $YELLOW "🚀 Iniciando instalação do $APP_NAME..."
    echo
    
    # Confirmar instalação
    read -p "Deseja continuar com a instalação? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_message $YELLOW "Instalação cancelada pelo usuário."
        exit 0
    fi
    
    # Executar etapas de instalação
    install_system_dependencies
    install_nodejs
    install_docker
    configure_firewall
    configure_fail2ban
    collect_user_info
    create_system_user
    create_directories
    setup_application
    configure_environment
    configure_docker_compose
    configure_nginx
    setup_ssl
    build_and_start
    setup_backup
    setup_monitoring
    create_management_script
    show_final_info
}

# Executar função principal
main "$@"
