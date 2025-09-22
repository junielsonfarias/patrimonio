#!/bin/bash

# Script de instalação simples - Sistema de Gestão Patrimonial
# Execute: curl -sSL https://raw.githubusercontent.com/junielsonfarias/patrimonio/principal/install-simple.sh | bash

set -e

echo "🏛️  Sistema de Gestão Patrimonial - Instalação Simples"
echo "=================================================="
echo

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
    echo "❌ Este script deve ser executado como root!"
    echo "Execute: sudo bash <(curl -sSL https://raw.githubusercontent.com/junielsonfarias/patrimonio/principal/install-simple.sh)"
    exit 1
fi

# Coletar informações básicas
echo "📝 Informações necessárias:"
read -p "🏛️  Nome da prefeitura: " PREFECTURE_NAME
read -p "🌐 Domínio do servidor: " DOMAIN
read -p "📧 Seu email: " EMAIL
read -s -p "🔐 Senha para o banco (mín. 8 chars): " DB_PASSWORD
echo

# Confirmar
echo
echo "📋 Confirmação:"
echo "   Prefeitura: $PREFECTURE_NAME"
echo "   Domínio: $DOMAIN"
echo "   Email: $EMAIL"
read -p "✅ Continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Instalação cancelada."
    exit 0
fi

echo "🚀 Iniciando instalação..."

# Atualizar sistema
echo "⏳ Atualizando sistema..."
apt-get update -y > /dev/null 2>&1
apt-get upgrade -y > /dev/null 2>&1

# Instalar dependências
echo "⏳ Instalando dependências..."
apt-get install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release ufw fail2ban htop nano vim tree jq certbot python3-certbot-nginx > /dev/null 2>&1

# Instalar Node.js
echo "⏳ Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt-get install -y nodejs > /dev/null 2>&1

# Instalar Docker
echo "⏳ Instalando Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg > /dev/null 2>&1
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y > /dev/null 2>&1
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin > /dev/null 2>&1
systemctl start docker
systemctl enable docker

# Configurar firewall
echo "⏳ Configurando firewall..."
ufw --force reset > /dev/null 2>&1
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow ssh > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1

# Configurar fail2ban
echo "⏳ Configurando proteção..."
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

# Baixar aplicação
echo "⏳ Baixando aplicação..."
mkdir -p /opt/patrimonio
git clone https://github.com/junielsonfarias/patrimonio.git /opt/patrimonio

# Criar usuário
if ! id "patrimonio" &>/dev/null; then
    useradd -r -s /bin/false -d /opt/patrimonio patrimonio
fi

# Configurar permissões
chown -R patrimonio:patrimonio /opt/patrimonio

# Gerar JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Configurar .env do backend
tee /opt/patrimonio/backend/.env > /dev/null <<EOF
DATABASE_URL="postgresql://patrimonio_user:${DB_PASSWORD}@postgres:5432/patrimonio_db?schema=public"
REDIS_URL="redis://redis:6379"
JWT_SECRET="${JWT_SECRET}"
JWT_EXPIRES_IN="8h"
JWT_REFRESH_SECRET="${JWT_SECRET}_refresh"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="production"
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL="info"
LOG_FILE="/app/logs/app.log"
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=90
HEALTH_CHECK_INTERVAL=30000
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
EOF

# Configurar .env do frontend
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

# Configurar SSL
echo "⏳ Configurando SSL..."
systemctl stop nginx 2>/dev/null || true
certbot certonly --standalone --email $EMAIL --agree-tos --no-eff-email --domains $DOMAIN --non-interactive > /dev/null 2>&1
mkdir -p /opt/patrimonio/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/patrimonio/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/patrimonio/ssl/key.pem
chown patrimonio:patrimonio /opt/patrimonio/ssl/*
chmod 600 /opt/patrimonio/ssl/*

# Configurar renovação automática
echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'docker compose -f /opt/patrimonio/docker-compose.prod.yml restart nginx'" | crontab -

# Iniciar aplicação
echo "⏳ Iniciando aplicação..."
cd /opt/patrimonio
sudo -u patrimonio docker compose -f docker-compose.prod.yml build > /dev/null 2>&1
sudo -u patrimonio docker compose -f docker-compose.prod.yml up -d > /dev/null 2>&1

# Aguardar
echo "⏳ Aguardando serviços iniciarem..."
sleep 120

# Criar script de gerenciamento
tee /usr/local/bin/patrimonio > /dev/null <<EOF
#!/bin/bash
APP_DIR="/opt/patrimonio"
SERVICE_USER="patrimonio"

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
    *)
        echo "Uso: patrimonio {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/patrimonio

# Exibir informações finais
echo
echo "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=================================="
echo
echo "🌐 URL da aplicação: https://$DOMAIN"
echo "📁 Diretório: /opt/patrimonio"
echo
echo "🔑 Usuários padrão:"
echo "   Supervisor: supervisor@prefeitura.gov.br / 123456"
echo "   Administrador: admin@prefeitura.gov.br / 123456"
echo "   Operador: operador@prefeitura.gov.br / 123456"
echo "   Consultor: consultor@prefeitura.gov.br / 123456"
echo
echo "🛠️  Comandos de gerenciamento:"
echo "   patrimonio start    - Iniciar sistema"
echo "   patrimonio stop     - Parar sistema"
echo "   patrimonio restart  - Reiniciar sistema"
echo "   patrimonio status   - Ver status"
echo "   patrimonio logs     - Ver logs"
echo
echo "⚠️  IMPORTANTE:"
echo "   1. Altere as senhas padrão após o primeiro acesso"
echo "   2. Configure o DNS do domínio para apontar para este servidor"
echo "   3. Mantenha o sistema atualizado regularmente"
echo
echo "✅ Acesse https://$DOMAIN para usar o sistema!"
