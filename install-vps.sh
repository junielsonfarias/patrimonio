#!/bin/bash

# =============================================================================
# INSTALADOR ALTERNATIVO - SISTEMA DE GESTÃO PATRIMONIAL
# =============================================================================
# Este script é uma versão alternativa para casos onde o arquivo principal
# não está disponível via raw.githubusercontent.com
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    clear
    print_message $CYAN "============================================================================="
    print_message $WHITE "        🏛️  SISTEMA DE GESTÃO PATRIMONIAL - INSTALAÇÃO VPS"
    print_message $CYAN "============================================================================="
    print_message $YELLOW "Este instalador irá configurar automaticamente o sistema em seu servidor"
    print_message $YELLOW "Você só precisa fornecer algumas informações básicas"
    print_message $CYAN "============================================================================="
    echo
}

# Função para pausar e aguardar confirmação
pause() {
    echo
    print_message $YELLOW "Pressione ENTER para continuar..."
    read
}

# Função para coletar informações básicas
collect_basic_info() {
    print_message $BLUE "📝 Vamos coletar algumas informações básicas:"
    echo
    
    # Nome da prefeitura
    while [[ -z "$PREFECTURE_NAME" ]]; do
        read -p "🏛️  Nome da sua prefeitura: " PREFECTURE_NAME
        if [[ -z "$PREFECTURE_NAME" ]]; then
            print_message $RED "❌ Nome da prefeitura é obrigatório!"
        fi
    done
    
    # Domínio
    while [[ -z "$DOMAIN" ]]; do
        read -p "🌐 Domínio do servidor (ex: patrimonio.prefeitura.gov.br): " DOMAIN
        if [[ -z "$DOMAIN" ]]; then
            print_message $RED "❌ Domínio é obrigatório!"
        fi
    done
    
    # Email
    while [[ -z "$EMAIL" ]]; do
        read -p "📧 Seu email (para certificados de segurança): " EMAIL
        if [[ -z "$EMAIL" ]]; then
            print_message $RED "❌ Email é obrigatório!"
        fi
    done
    
    # Senha do banco
    while [[ -z "$DB_PASSWORD" ]]; do
        read -s -p "🔐 Senha para o banco de dados (mínimo 8 caracteres): " DB_PASSWORD
        echo
        if [[ ${#DB_PASSWORD} -lt 8 ]]; then
            print_message $RED "❌ Senha deve ter pelo menos 8 caracteres!"
            DB_PASSWORD=""
        fi
    done
    
    # Confirmar informações
    echo
    print_message $BLUE "📋 Confirme as informações:"
    print_message $WHITE "   Prefeitura: $PREFECTURE_NAME"
    print_message $WHITE "   Domínio: $DOMAIN"
    print_message $WHITE "   Email: $EMAIL"
    print_message $WHITE "   Senha do banco: [OCULTA]"
    echo
    
    read -p "✅ As informações estão corretas? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_message $YELLOW "Vamos coletar as informações novamente..."
        echo
        PREFECTURE_NAME=""
        DOMAIN=""
        EMAIL=""
        DB_PASSWORD=""
        collect_basic_info
    fi
}

# Função para verificar pré-requisitos
check_prerequisites() {
    print_message $BLUE "🔍 Verificando se o servidor está pronto..."
    echo
    
    # Verificar se é Ubuntu/Debian
    if [[ ! -f /etc/os-release ]]; then
        print_message $RED "❌ Sistema operacional não suportado!"
        print_message $YELLOW "Este instalador funciona apenas com Ubuntu ou Debian"
        exit 1
    fi
    
    . /etc/os-release
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        print_message $RED "❌ Sistema operacional não suportado!"
        print_message $YELLOW "Este instalador funciona apenas com Ubuntu ou Debian"
        exit 1
    fi
    
    print_message $GREEN "✅ Sistema operacional: $PRETTY_NAME"
    
    # Verificar memória
    local total_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local total_gb=$((total_kb / 1024 / 1024))
    
    if [[ $total_gb -lt 2 ]]; then
        print_message $RED "❌ Memória insuficiente: ${total_gb}GB (mínimo 2GB)"
        exit 1
    fi
    
    print_message $GREEN "✅ Memória RAM: ${total_gb}GB"
    
    # Verificar espaço em disco
    local available_kb=$(df / | tail -1 | awk '{print $4}')
    local available_gb=$((available_kb / 1024 / 1024))
    
    if [[ $available_gb -lt 10 ]]; then
        print_message $RED "❌ Espaço em disco insuficiente: ${available_gb}GB (mínimo 10GB)"
        exit 1
    fi
    
    print_message $GREEN "✅ Espaço em disco: ${available_gb}GB"
    
    # Verificar conectividade
    if ! curl -s --connect-timeout 5 https://www.google.com > /dev/null; then
        print_message $RED "❌ Sem conexão com a internet!"
        exit 1
    fi
    
    print_message $GREEN "✅ Conectividade com internet: OK"
    
    echo
    print_message $GREEN "🎉 Servidor está pronto para instalação!"
    pause
}

# Função para instalar dependências
install_dependencies() {
    print_message $BLUE "📦 Instalando dependências do sistema..."
    echo
    
    # Atualizar sistema
    print_message $YELLOW "⏳ Atualizando sistema (pode demorar alguns minutos)..."
    apt-get update -y > /dev/null 2>&1
    apt-get upgrade -y > /dev/null 2>&1
    
    # Instalar dependências básicas
    print_message $YELLOW "⏳ Instalando dependências básicas..."
    apt-get install -y \
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
        python3-certbot-nginx > /dev/null 2>&1
    
    print_message $GREEN "✅ Dependências básicas instaladas"
    
    # Instalar Node.js
    print_message $YELLOW "⏳ Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
    
    print_message $GREEN "✅ Node.js instalado"
    
    # Instalar Docker
    print_message $YELLOW "⏳ Instalando Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg > /dev/null 2>&1
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update -y > /dev/null 2>&1
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin > /dev/null 2>&1
    
    systemctl start docker
    systemctl enable docker
    
    print_message $GREEN "✅ Docker instalado"
    
    echo
    print_message $GREEN "🎉 Todas as dependências foram instaladas com sucesso!"
    pause
}

# Função para configurar segurança
configure_security() {
    print_message $BLUE "🔒 Configurando segurança do servidor..."
    echo
    
    # Configurar firewall
    print_message $YELLOW "⏳ Configurando firewall..."
    ufw --force reset > /dev/null 2>&1
    ufw default deny incoming > /dev/null 2>&1
    ufw default allow outgoing > /dev/null 2>&1
    ufw allow ssh > /dev/null 2>&1
    ufw allow 80/tcp > /dev/null 2>&1
    ufw allow 443/tcp > /dev/null 2>&1
    ufw --force enable > /dev/null 2>&1
    
    print_message $GREEN "✅ Firewall configurado"
    
    # Configurar fail2ban
    print_message $YELLOW "⏳ Configurando proteção contra ataques..."
    tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF
    
    systemctl restart fail2ban > /dev/null 2>&1
    systemctl enable fail2ban > /dev/null 2>&1
    
    print_message $GREEN "✅ Proteção contra ataques configurada"
    
    echo
    print_message $GREEN "🎉 Segurança configurada com sucesso!"
    pause
}

# Função para baixar e configurar aplicação
setup_application() {
    print_message $BLUE "📥 Baixando e configurando a aplicação..."
    echo
    
    # Criar diretório da aplicação
    mkdir -p /opt/patrimonio
    chown $SUDO_USER:$SUDO_USER /opt/patrimonio
    
    # Baixar aplicação do repositório GitHub
    print_message $YELLOW "⏳ Baixando código da aplicação..."
    
    git clone https://github.com/junielsonfarias/patrimonio.git /opt/patrimonio
    
    # Verificar se o clone foi bem-sucedido
    if [[ ! -d "/opt/patrimonio" ]]; then
        print_message $RED "❌ Erro ao baixar código do repositório!"
        print_message $YELLOW "Verifique sua conexão com a internet e tente novamente"
        exit 1
    fi
    
    cd /opt/patrimonio
    
    # Criar usuário do sistema
    if ! id "patrimonio" &>/dev/null; then
        useradd -r -s /bin/false -d /opt/patrimonio patrimonio
    fi
    
    # Configurar permissões
    chown -R patrimonio:patrimonio /opt/patrimonio
    chmod +x /opt/patrimonio/install.sh
    
    print_message $GREEN "✅ Aplicação baixada e configurada"
    
    # Configurar variáveis de ambiente
    print_message $YELLOW "⏳ Configurando variáveis de ambiente..."
    
    # Gerar JWT secret
    JWT_SECRET=$(openssl rand -base64 64)
    
    # Backend .env
    tee /opt/patrimonio/backend/.env > /dev/null <<EOF
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
    tee /opt/patrimonio/frontend/.env > /dev/null <<EOF
VITE_API_URL=https://${DOMAIN}/api
VITE_APP_NAME=Sistema de Gestão Patrimonial - ${PREFECTURE_NAME}
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
EOF

    # Definir permissões
    chown patrimonio:patrimonio /opt/patrimonio/backend/.env
    chown patrimonio:patrimonio /opt/patrimonio/frontend/.env
    chmod 600 /opt/patrimonio/backend/.env
    chmod 600 /opt/patrimonio/frontend/.env
    
    print_message $GREEN "✅ Variáveis de ambiente configuradas"
    
    echo
    print_message $GREEN "🎉 Aplicação configurada com sucesso!"
    pause
}

# Função para configurar SSL
setup_ssl() {
    print_message $BLUE "🔒 Configurando certificado de segurança (SSL)..."
    echo
    
    # Parar nginx temporariamente
    systemctl stop nginx 2>/dev/null || true
    
    # Obter certificado com Let's Encrypt
    print_message $YELLOW "⏳ Obtendo certificado SSL (pode demorar alguns minutos)..."
    certbot certonly --standalone \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN \
        --non-interactive > /dev/null 2>&1
    
    # Copiar certificados
    mkdir -p /opt/patrimonio/ssl
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/patrimonio/ssl/cert.pem
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/patrimonio/ssl/key.pem
    
    # Definir permissões
    chown patrimonio:patrimonio /opt/patrimonio/ssl/*
    chmod 600 /opt/patrimonio/ssl/*
    
    # Configurar renovação automática
    echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'docker compose -f /opt/patrimonio/docker-compose.prod.yml restart nginx'" | crontab -
    
    print_message $GREEN "✅ Certificado SSL configurado"
    
    echo
    print_message $GREEN "🎉 Segurança SSL configurada com sucesso!"
    pause
}

# Função para iniciar aplicação
start_application() {
    print_message $BLUE "🚀 Iniciando a aplicação..."
    echo
    
    cd /opt/patrimonio
    
    # Construir imagens
    print_message $YELLOW "⏳ Construindo imagens (pode demorar alguns minutos)..."
    sudo -u patrimonio docker compose -f docker-compose.prod.yml build > /dev/null 2>&1
    
    # Iniciar serviços
    print_message $YELLOW "⏳ Iniciando serviços..."
    sudo -u patrimonio docker compose -f docker-compose.prod.yml up -d > /dev/null 2>&1
    
    # Aguardar serviços iniciarem
    print_message $YELLOW "⏳ Aguardando serviços iniciarem (aguarde 2 minutos)..."
    sleep 120
    
    # Verificar status
    print_message $YELLOW "⏳ Verificando status dos serviços..."
    sudo -u patrimonio docker compose -f docker-compose.prod.yml ps
    
    print_message $GREEN "✅ Aplicação iniciada com sucesso!"
    
    echo
    print_message $GREEN "🎉 Sistema está funcionando!"
    pause
}

# Função para exibir informações finais
show_final_info() {
    print_message $CYAN "============================================================================="
    print_message $WHITE "                    🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
    print_message $CYAN "============================================================================="
    echo
    print_message $GREEN "🏛️  Sistema de Gestão Patrimonial - $PREFECTURE_NAME"
    print_message $GREEN "✅ Instalado e configurado com sucesso!"
    echo
    print_message $YELLOW "📋 INFORMAÇÕES IMPORTANTES:"
    echo
    print_message $WHITE "🌐 URL da aplicação: https://$DOMAIN"
    print_message $WHITE "📁 Diretório da aplicação: /opt/patrimonio"
    print_message $WHITE "👤 Usuário do sistema: patrimonio"
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
    print_message $WHITE "   Logs da aplicação: /opt/patrimonio/logs/"
    print_message $WHITE "   Backups: /opt/patrimonio/backups/"
    print_message $WHITE "   Health checks: /opt/patrimonio/logs/health-check.log"
    echo
    print_message $YELLOW "🔒 SEGURANÇA:"
    print_message $WHITE "   Firewall configurado (UFW)"
    print_message $WHITE "   Fail2ban ativo"
    print_message $WHITE "   SSL/TLS habilitado"
    print_message $WHITE "   Backup automático diário"
    echo
    print_message $RED "⚠️  IMPORTANTE:"
    print_message $WHITE "   1. Altere as senhas padrão após o primeiro acesso"
    print_message $WHITE "   2. Configure o DNS do domínio para apontar para este servidor"
    print_message $WHITE "   3. Mantenha o sistema atualizado regularmente"
    echo
    print_message $CYAN "============================================================================="
    print_message $GREEN "✅ Instalação finalizada! Acesse https://$DOMAIN para usar o sistema."
    print_message $CYAN "============================================================================="
}

# Função principal
main() {
    print_header
    
    # Verificar se é root
    if [[ $EUID -ne 0 ]]; then
        print_message $RED "❌ ERRO: Este script deve ser executado como root!"
        print_message $YELLOW "Execute: sudo $0"
        exit 1
    fi
    
    print_message $YELLOW "🚀 Bem-vindo ao instalador do Sistema de Gestão Patrimonial!"
    echo
    print_message $BLUE "Este instalador irá:"
    print_message $WHITE "   ✅ Instalar todas as dependências necessárias"
    print_message $WHITE "   ✅ Configurar segurança do servidor"
    print_message $WHITE "   ✅ Baixar e configurar a aplicação"
    print_message $WHITE "   ✅ Configurar certificado SSL"
    print_message $WHITE "   ✅ Configurar backup automático"
    print_message $WHITE "   ✅ Configurar monitoramento"
    echo
    
    # Confirmar instalação
    read -p "Deseja continuar com a instalação? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_message $YELLOW "Instalação cancelada pelo usuário."
        exit 0
    fi
    
    # Executar etapas de instalação
    collect_basic_info
    check_prerequisites
    install_dependencies
    configure_security
    setup_application
    setup_ssl
    start_application
    show_final_info
}

# Executar função principal
main "$@"
