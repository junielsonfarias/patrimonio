#!/bin/bash

# =============================================================================
# SCRIPT DE VERIFICAÇÃO DE DEPENDÊNCIAS
# Sistema de Gestão Patrimonial
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    clear
    print_message $BLUE "============================================================================="
    print_message $BLUE "           VERIFICAÇÃO DE DEPENDÊNCIAS - SISTEMA PATRIMONIAL"
    print_message $BLUE "============================================================================="
    echo
}

# Função para verificar comando
check_command() {
    local cmd=$1
    local name=$2
    local required_version=$3
    
    if command -v $cmd &> /dev/null; then
        local version=$($cmd --version 2>/dev/null | head -n1 || echo "versão desconhecida")
        print_message $GREEN "✅ $name: $version"
        return 0
    else
        print_message $RED "❌ $name: NÃO INSTALADO"
        return 1
    fi
}

# Função para verificar versão específica
check_version() {
    local cmd=$1
    local name=$2
    local required_version=$3
    
    if command -v $cmd &> /dev/null; then
        local version=$($cmd --version 2>/dev/null | head -n1)
        print_message $GREEN "✅ $name: $version"
        
        # Verificar se a versão atende aos requisitos
        if [[ $name == "Node.js" ]]; then
            local node_version=$(node --version | sed 's/v//')
            local major_version=$(echo $node_version | cut -d. -f1)
            if [[ $major_version -ge 20 ]]; then
                print_message $GREEN "   ✅ Versão compatível (>= 20.x)"
            else
                print_message $YELLOW "   ⚠️  Versão pode ser incompatível (requer >= 20.x)"
            fi
        fi
        
        return 0
    else
        print_message $RED "❌ $name: NÃO INSTALADO"
        return 1
    fi
}

# Função para verificar porta
check_port() {
    local port=$1
    local service=$2
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        print_message $YELLOW "⚠️  Porta $port ($service): EM USO"
        return 1
    else
        print_message $GREEN "✅ Porta $port ($service): DISPONÍVEL"
        return 0
    fi
}

# Função para verificar espaço em disco
check_disk_space() {
    local path=$1
    local required_gb=$2
    
    local available_kb=$(df $path | tail -1 | awk '{print $4}')
    local available_gb=$((available_kb / 1024 / 1024))
    
    if [[ $available_gb -ge $required_gb ]]; then
        print_message $GREEN "✅ Espaço em disco: ${available_gb}GB disponível (requer ${required_gb}GB)"
        return 0
    else
        print_message $RED "❌ Espaço em disco: ${available_gb}GB disponível (requer ${required_gb}GB)"
        return 1
    fi
}

# Função para verificar memória
check_memory() {
    local required_gb=$1
    
    local total_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local total_gb=$((total_kb / 1024 / 1024))
    
    if [[ $total_gb -ge $required_gb ]]; then
        print_message $GREEN "✅ Memória RAM: ${total_gb}GB disponível (requer ${required_gb}GB)"
        return 0
    else
        print_message $RED "❌ Memória RAM: ${total_gb}GB disponível (requer ${required_gb}GB)"
        return 1
    fi
}

# Função para verificar conectividade
check_connectivity() {
    local url=$1
    local name=$2
    
    if curl -s --connect-timeout 5 $url > /dev/null; then
        print_message $GREEN "✅ Conectividade $name: OK"
        return 0
    else
        print_message $RED "❌ Conectividade $name: FALHA"
        return 1
    fi
}

# Função para verificar permissões
check_permissions() {
    local path=$1
    local name=$2
    
    if [[ -w $path ]]; then
        print_message $GREEN "✅ Permissões $name: OK"
        return 0
    else
        print_message $RED "❌ Permissões $name: SEM PERMISSÃO DE ESCRITA"
        return 1
    fi
}

# Função principal
main() {
    print_header
    
    local errors=0
    
    print_message $BLUE "🔍 Verificando dependências do sistema..."
    echo
    
    # Verificar sistema operacional
    print_message $YELLOW "📋 SISTEMA OPERACIONAL:"
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        print_message $GREEN "✅ Sistema: $NAME $VERSION_ID"
    else
        print_message $RED "❌ Sistema: Não identificado"
        ((errors++))
    fi
    echo
    
    # Verificar recursos do sistema
    print_message $YELLOW "💻 RECURSOS DO SISTEMA:"
    check_memory 2
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_disk_space "/" 10
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    echo
    
    # Verificar dependências básicas
    print_message $YELLOW "📦 DEPENDÊNCIAS BÁSICAS:"
    check_command "curl" "cURL"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_command "wget" "Wget"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_command "git" "Git"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_command "unzip" "Unzip"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    echo
    
    # Verificar Node.js
    print_message $YELLOW "🟢 NODE.JS:"
    check_version "node" "Node.js" "20.x"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_version "npm" "npm" "10.x"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    echo
    
    # Verificar Docker
    print_message $YELLOW "🐳 DOCKER:"
    check_command "docker" "Docker"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_command "docker" "Docker Compose"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    # Verificar se usuário está no grupo docker
    if groups | grep -q docker; then
        print_message $GREEN "✅ Usuário no grupo docker: OK"
    else
        print_message $YELLOW "⚠️  Usuário não está no grupo docker (pode precisar de sudo)"
    fi
    echo
    
    # Verificar portas
    print_message $YELLOW "🔌 PORTAS:"
    check_port 80 "HTTP"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_port 443 "HTTPS"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_port 3000 "Backend"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_port 5432 "PostgreSQL"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_port 6379 "Redis"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    echo
    
    # Verificar conectividade
    print_message $YELLOW "🌐 CONECTIVIDADE:"
    check_connectivity "https://www.google.com" "Internet"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_connectivity "https://registry.npmjs.org" "NPM Registry"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_connectivity "https://download.docker.com" "Docker Registry"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    echo
    
    # Verificar permissões
    print_message $YELLOW "🔐 PERMISSÕES:"
    check_permissions "/opt" "Diretório /opt"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    
    check_permissions "/tmp" "Diretório /tmp"
    if [[ $? -ne 0 ]]; then ((errors++)); fi
    echo
    
    # Verificar firewall
    print_message $YELLOW "🔥 FIREWALL:"
    if command -v ufw &> /dev/null; then
        local ufw_status=$(sudo ufw status | head -1)
        print_message $GREEN "✅ UFW: $ufw_status"
    else
        print_message $YELLOW "⚠️  UFW: Não instalado (será instalado automaticamente)"
    fi
    echo
    
    # Verificar fail2ban
    print_message $YELLOW "🛡️  FAIL2BAN:"
    if command -v fail2ban-client &> /dev/null; then
        print_message $GREEN "✅ Fail2ban: Instalado"
    else
        print_message $YELLOW "⚠️  Fail2ban: Não instalado (será instalado automaticamente)"
    fi
    echo
    
    # Verificar certificados SSL
    print_message $YELLOW "🔒 SSL:"
    if command -v certbot &> /dev/null; then
        print_message $GREEN "✅ Certbot: Instalado"
    else
        print_message $YELLOW "⚠️  Certbot: Não instalado (será instalado automaticamente)"
    fi
    echo
    
    # Resumo final
    print_message $BLUE "============================================================================="
    if [[ $errors -eq 0 ]]; then
        print_message $GREEN "🎉 TODAS AS VERIFICAÇÕES PASSARAM!"
        print_message $GREEN "✅ O sistema está pronto para instalação."
    else
        print_message $RED "❌ $errors ERRO(S) ENCONTRADO(S)"
        print_message $YELLOW "⚠️  Algumas dependências precisam ser instaladas ou configuradas."
        print_message $YELLOW "   Execute o script de instalação para corrigir automaticamente."
    fi
    print_message $BLUE "============================================================================="
    
    exit $errors
}

# Executar função principal
main "$@"
