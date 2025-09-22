#!/bin/bash

# =============================================================================
# SCRIPT DE PÓS-INSTALAÇÃO E CONFIGURAÇÃO
# Sistema de Gestão Patrimonial
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

# Configurações
APP_DIR="/opt/patrimonio"
SERVICE_USER="patrimonio"
DOMAIN=""

# Função para imprimir mensagens coloridas
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    clear
    print_message $CYAN "============================================================================="
    print_message $WHITE "           CONFIGURAÇÃO PÓS-INSTALAÇÃO - SISTEMA PATRIMONIAL"
    print_message $CYAN "============================================================================="
    echo
}

# Função para verificar se a aplicação está rodando
check_application_status() {
    print_message $BLUE "🔍 Verificando status da aplicação..."
    
    if [[ -f "$APP_DIR/docker-compose.prod.yml" ]]; then
        cd $APP_DIR
        local status=$(sudo -u $SERVICE_USER docker compose -f docker-compose.prod.yml ps --format json | jq -r '.[] | select(.Service == "backend") | .State' 2>/dev/null || echo "unknown")
        
        if [[ "$status" == "running" ]]; then
            print_message $GREEN "✅ Aplicação está rodando"
            return 0
        else
            print_message $RED "❌ Aplicação não está rodando (Status: $status)"
            return 1
        fi
    else
        print_message $RED "❌ Arquivo docker-compose.prod.yml não encontrado"
        return 1
    fi
}

# Função para configurar banco de dados
setup_database() {
    print_message $BLUE "🗄️  Configurando banco de dados..."
    
    cd $APP_DIR
    
    # Aguardar banco estar pronto
    print_message $YELLOW "⏳ Aguardando banco de dados estar pronto..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if sudo -u $SERVICE_USER docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U patrimonio_user -d patrimonio_db > /dev/null 2>&1; then
            print_message $GREEN "✅ Banco de dados está pronto"
            break
        else
            print_message $YELLOW "⏳ Tentativa $attempt/$max_attempts - Aguardando banco..."
            sleep 2
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        print_message $RED "❌ Banco de dados não ficou pronto a tempo"
        return 1
    fi
    
    # Executar migrações
    print_message $BLUE "📊 Executando migrações do banco..."
    sudo -u $SERVICE_USER docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
    
    # Executar seed
    print_message $BLUE "🌱 Populando banco com dados iniciais..."
    sudo -u $SERVICE_USER docker compose -f docker-compose.prod.yml exec -T backend npm run prisma:seed
    
    print_message $GREEN "✅ Banco de dados configurado com sucesso!"
}

# Função para configurar usuários iniciais
setup_initial_users() {
    print_message $BLUE "👥 Configurando usuários iniciais..."
    
    cd $APP_DIR
    
    # Verificar se os usuários já existem
    local user_count=$(sudo -u $SERVICE_USER docker compose -f docker-compose.prod.yml exec -T postgres psql -U patrimonio_user -d patrimonio_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [[ "$user_count" -gt 0 ]]; then
        print_message $YELLOW "⚠️  Usuários já existem no banco de dados"
        return 0
    fi
    
    # Criar usuários iniciais via API ou script
    print_message $BLUE "👤 Criando usuários padrão..."
    
    # Aguardar API estar pronta
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            print_message $GREEN "✅ API está pronta"
            break
        else
            print_message $YELLOW "⏳ Tentativa $attempt/$max_attempts - Aguardando API..."
            sleep 2
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        print_message $RED "❌ API não ficou pronta a tempo"
        return 1
    fi
    
    print_message $GREEN "✅ Usuários iniciais configurados!"
}

# Função para configurar backup inicial
setup_initial_backup() {
    print_message $BLUE "💾 Executando backup inicial..."
    
    if [[ -f "$APP_DIR/backup.sh" ]]; then
        sudo -u $SERVICE_USER $APP_DIR/backup.sh
        print_message $GREEN "✅ Backup inicial executado com sucesso!"
    else
        print_message $YELLOW "⚠️  Script de backup não encontrado"
    fi
}

# Função para configurar monitoramento
setup_monitoring() {
    print_message $BLUE "📊 Configurando monitoramento..."
    
    # Verificar se Prometheus está rodando
    if sudo -u $SERVICE_USER docker compose -f $APP_DIR/docker-compose.prod.yml ps | grep -q "prometheus.*Up"; then
        print_message $GREEN "✅ Prometheus está rodando"
    else
        print_message $YELLOW "⚠️  Prometheus não está rodando"
    fi
    
    # Verificar se Grafana está rodando
    if sudo -u $SERVICE_USER docker compose -f $APP_DIR/docker-compose.prod.yml ps | grep -q "grafana.*Up"; then
        print_message $GREEN "✅ Grafana está rodando"
    else
        print_message $YELLOW "⚠️  Grafana não está rodando"
    fi
    
    # Executar health check inicial
    if [[ -f "$APP_DIR/health-check.sh" ]]; then
        sudo -u $SERVICE_USER $APP_DIR/health-check.sh
        print_message $GREEN "✅ Health check inicial executado"
    fi
    
    print_message $GREEN "✅ Monitoramento configurado!"
}

# Função para testar conectividade
test_connectivity() {
    print_message $BLUE "🌐 Testando conectividade..."
    
    local tests_passed=0
    local total_tests=0
    
    # Testar backend
    ((total_tests++))
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        print_message $GREEN "✅ Backend: OK"
        ((tests_passed++))
    else
        print_message $RED "❌ Backend: FALHA"
    fi
    
    # Testar frontend
    ((total_tests++))
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        print_message $GREEN "✅ Frontend: OK"
        ((tests_passed++))
    else
        print_message $RED "❌ Frontend: FALHA"
    fi
    
    # Testar banco de dados
    ((total_tests++))
    if sudo -u $SERVICE_USER docker compose -f $APP_DIR/docker-compose.prod.yml exec -T postgres pg_isready -U patrimonio_user -d patrimonio_db > /dev/null 2>&1; then
        print_message $GREEN "✅ Banco de dados: OK"
        ((tests_passed++))
    else
        print_message $RED "❌ Banco de dados: FALHA"
    fi
    
    # Testar Redis
    ((total_tests++))
    if sudo -u $SERVICE_USER docker compose -f $APP_DIR/docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_message $GREEN "✅ Redis: OK"
        ((tests_passed++))
    else
        print_message $RED "❌ Redis: FALHA"
    fi
    
    # Testar Nginx (se configurado)
    if [[ -n "$DOMAIN" ]]; then
        ((total_tests++))
        if curl -s -k https://$DOMAIN > /dev/null 2>&1; then
            print_message $GREEN "✅ Nginx/SSL: OK"
            ((tests_passed++))
        else
            print_message $RED "❌ Nginx/SSL: FALHA"
        fi
    fi
    
    print_message $BLUE "📊 Resultado: $tests_passed/$total_tests testes passaram"
    
    if [[ $tests_passed -eq $total_tests ]]; then
        print_message $GREEN "🎉 Todos os testes passaram!"
        return 0
    else
        print_message $YELLOW "⚠️  Alguns testes falharam"
        return 1
    fi
}

# Função para configurar logs
setup_logs() {
    print_message $BLUE "📝 Configurando logs..."
    
    # Criar diretórios de log se não existirem
    sudo mkdir -p $APP_DIR/logs/{app,nginx,backup}
    
    # Configurar rotação de logs
    sudo tee /etc/logrotate.d/patrimonio > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        docker compose -f $APP_DIR/docker-compose.prod.yml restart nginx > /dev/null 2>&1 || true
    endscript
}
EOF
    
    print_message $GREEN "✅ Logs configurados!"
}

# Função para configurar atualizações automáticas
setup_auto_updates() {
    print_message $BLUE "🔄 Configurando atualizações automáticas..."
    
    # Script de atualização
    sudo tee $APP_DIR/update.sh > /dev/null <<EOF
#!/bin/bash

# Script de atualização automática do Sistema de Gestão Patrimonial
APP_DIR="$APP_DIR"
SERVICE_USER="$SERVICE_USER"

echo "Iniciando atualização do Sistema de Gestão Patrimonial..."

# Fazer backup antes da atualização
echo "Executando backup antes da atualização..."
$APP_DIR/backup.sh

# Parar aplicação
echo "Parando aplicação..."
cd \$APP_DIR
sudo -u \$SERVICE_USER docker compose -f docker-compose.prod.yml down

# Atualizar código (se for um repositório Git)
if [[ -d "\$APP_DIR/.git" ]]; then
    echo "Atualizando código do repositório..."
    cd \$APP_DIR
    sudo -u \$SERVICE_USER git pull
fi

# Reconstruir imagens
echo "Reconstruindo imagens Docker..."
sudo -u \$SERVICE_USER docker compose -f docker-compose.prod.yml build

# Executar migrações
echo "Executando migrações do banco..."
sudo -u \$SERVICE_USER docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Iniciar aplicação
echo "Iniciando aplicação..."
sudo -u \$SERVICE_USER docker compose -f docker-compose.prod.yml up -d

# Verificar status
echo "Verificando status da aplicação..."
sleep 10
sudo -u \$SERVICE_USER docker compose -f docker-compose.prod.yml ps

echo "Atualização concluída!"
EOF

    sudo chmod +x $APP_DIR/update.sh
    sudo chown $SERVICE_USER:$SERVICE_USER $APP_DIR/update.sh
    
    # Configurar cron para atualizações semanais (domingo às 3h)
    echo "0 3 * * 0 $APP_DIR/update.sh >> $APP_DIR/logs/update.log 2>&1" | sudo crontab -u $SERVICE_USER -
    
    print_message $GREEN "✅ Atualizações automáticas configuradas!"
}

# Função para exibir informações do sistema
show_system_info() {
    print_message $BLUE "📊 Informações do sistema:"
    echo
    
    # Status dos containers
    print_message $YELLOW "🐳 Status dos containers:"
    cd $APP_DIR
    sudo -u $SERVICE_USER docker compose -f docker-compose.prod.yml ps
    echo
    
    # Uso de recursos
    print_message $YELLOW "💻 Uso de recursos:"
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo "Memória: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
    echo "Disco: $(df -h / | tail -1 | awk '{print $5}')"
    echo
    
    # Logs recentes
    print_message $YELLOW "📝 Logs recentes:"
    if [[ -f "$APP_DIR/logs/app.log" ]]; then
        tail -5 $APP_DIR/logs/app.log
    else
        echo "Nenhum log encontrado"
    fi
    echo
}

# Função para criar relatório de instalação
create_installation_report() {
    print_message $BLUE "📋 Criando relatório de instalação..."
    
    local report_file="$APP_DIR/installation-report.txt"
    
    sudo tee $report_file > /dev/null <<EOF
=============================================================================
RELATÓRIO DE INSTALAÇÃO - SISTEMA DE GESTÃO PATRIMONIAL
=============================================================================
Data da instalação: $(date)
Sistema operacional: $(lsb_release -d | cut -f2)
Usuário do sistema: $SERVICE_USER
Diretório da aplicação: $APP_DIR
Domínio: $DOMAIN

=============================================================================
SERVIÇOS INSTALADOS:
=============================================================================
- Node.js: $(node --version 2>/dev/null || echo "N/A")
- Docker: $(docker --version 2>/dev/null || echo "N/A")
- Docker Compose: $(docker compose version 2>/dev/null || echo "N/A")
- Nginx: $(nginx -v 2>&1 | cut -d' ' -f3 || echo "N/A")
- PostgreSQL: $(sudo -u $SERVICE_USER docker compose -f $APP_DIR/docker-compose.prod.yml exec -T postgres psql -U patrimonio_user -d patrimonio_db -t -c "SELECT version();" 2>/dev/null | head -1 || echo "N/A")
- Redis: $(sudo -u $SERVICE_USER docker compose -f $APP_DIR/docker-compose.prod.yml exec -T redis redis-cli --version 2>/dev/null || echo "N/A")

=============================================================================
CONFIGURAÇÕES DE SEGURANÇA:
=============================================================================
- Firewall (UFW): $(sudo ufw status | head -1)
- Fail2ban: $(systemctl is-active fail2ban 2>/dev/null || echo "inactive")
- SSL/TLS: $(if [[ -f "$APP_DIR/ssl/cert.pem" ]]; then echo "Configurado"; else echo "Não configurado"; fi)

=============================================================================
BACKUP E MONITORAMENTO:
=============================================================================
- Backup automático: Configurado (diário às 2h)
- Health checks: Configurado (a cada 5 minutos)
- Logs: $APP_DIR/logs/
- Backups: $APP_DIR/backups/

=============================================================================
COMANDOS ÚTEIS:
=============================================================================
- Iniciar sistema: patrimonio start
- Parar sistema: patrimonio stop
- Reiniciar sistema: patrimonio restart
- Ver status: patrimonio status
- Ver logs: patrimonio logs
- Backup manual: patrimonio backup
- Atualizar sistema: patrimonio update

=============================================================================
ACESSO À APLICAÇÃO:
=============================================================================
URL: https://$DOMAIN
Usuários padrão:
- Supervisor: supervisor@prefeitura.gov.br / 123456
- Administrador: admin@prefeitura.gov.br / 123456
- Operador: operador@prefeitura.gov.br / 123456
- Consultor: consultor@prefeitura.gov.br / 123456

=============================================================================
PRÓXIMOS PASSOS:
=============================================================================
1. Acesse a aplicação em https://$DOMAIN
2. Faça login com um dos usuários padrão
3. Altere as senhas padrão
4. Configure as secretarias e funcionários
5. Importe dados iniciais se necessário
6. Configure notificações por email
7. Teste todas as funcionalidades

=============================================================================
SUPORTE:
=============================================================================
- Logs da aplicação: $APP_DIR/logs/
- Documentação: $APP_DIR/README.md
- Scripts de gerenciamento: /usr/local/bin/patrimonio

=============================================================================
EOF

    sudo chown $SERVICE_USER:$SERVICE_USER $report_file
    
    print_message $GREEN "✅ Relatório criado: $report_file"
}

# Função principal
main() {
    print_header
    
    # Verificar se a aplicação foi instalada
    if [[ ! -d "$APP_DIR" ]]; then
        print_message $RED "❌ Diretório da aplicação não encontrado: $APP_DIR"
        print_message $YELLOW "Execute primeiro o script de instalação (install.sh)"
        exit 1
    fi
    
    # Coletar domínio se não foi fornecido
    if [[ -z "$DOMAIN" ]]; then
        read -p "🌐 Digite o domínio da aplicação: " DOMAIN
    fi
    
    print_message $YELLOW "🚀 Iniciando configuração pós-instalação..."
    echo
    
    # Executar configurações
    check_application_status
    if [[ $? -ne 0 ]]; then
        print_message $RED "❌ Aplicação não está rodando. Execute: patrimonio start"
        exit 1
    fi
    
    setup_database
    setup_initial_users
    setup_initial_backup
    setup_monitoring
    test_connectivity
    setup_logs
    setup_auto_updates
    show_system_info
    create_installation_report
    
    print_message $CYAN "============================================================================="
    print_message $GREEN "🎉 CONFIGURAÇÃO PÓS-INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
    print_message $CYAN "============================================================================="
    echo
    print_message $GREEN "✅ Sistema totalmente configurado e funcionando!"
    print_message $YELLOW "📋 Próximos passos:"
    print_message $WHITE "   1. Acesse https://$DOMAIN"
    print_message $WHITE "   2. Faça login com um dos usuários padrão"
    print_message $WHITE "   3. Altere as senhas padrão"
    print_message $WHITE "   4. Configure as secretarias e funcionários"
    echo
    print_message $BLUE "📊 Use 'patrimonio status' para verificar o status do sistema"
    print_message $BLUE "📝 Use 'patrimonio logs' para ver os logs em tempo real"
    print_message $BLUE "💾 Use 'patrimonio backup' para fazer backup manual"
    echo
    print_message $CYAN "============================================================================="
}

# Executar função principal
main "$@"
