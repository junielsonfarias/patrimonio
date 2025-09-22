# 🚀 Guia de Instalação - Sistema de Gestão Patrimonial

Este guia fornece instruções detalhadas para instalar o Sistema de Gestão Patrimonial em um servidor Linux (VPS), mesmo para usuários sem conhecimento técnico.

## 📋 Pré-requisitos

### Requisitos do Servidor
- **Sistema Operacional**: Ubuntu 20.04+ ou Debian 11+
- **Memória RAM**: Mínimo 2GB (recomendado 4GB+)
- **Espaço em Disco**: Mínimo 10GB livres
- **Processador**: 2 cores (recomendado 4 cores+)
- **Conexão**: Internet estável

### Requisitos de Domínio
- **Domínio**: Um domínio configurado (ex: `patrimonio.prefeitura.gov.br`)
- **DNS**: Configurado para apontar para o IP do servidor
- **Email**: Um email válido para certificados SSL

## 🎯 Instalação Automática (Recomendado)

### Passo 1: Conectar ao Servidor

1. **Via SSH** (recomendado):
   ```bash
   ssh usuario@ip-do-servidor
   ```

2. **Via Terminal Web** (se disponível no painel do VPS)

### Passo 2: Baixar o Script de Instalação

```bash
# Baixar o script de instalação
wget https://raw.githubusercontent.com/junielsonfarias/patrimonio/principal/install.sh

# Tornar o script executável
chmod +x install.sh
```

### Passo 3: Executar a Instalação

```bash
# Executar o script de instalação
./install.sh
```

### Passo 4: Seguir as Instruções

O script irá:
1. ✅ Verificar dependências do sistema
2. ✅ Instalar Node.js, Docker e outras dependências
3. ✅ Configurar firewall e segurança
4. ✅ Coletar informações necessárias
5. ✅ Baixar e configurar a aplicação
6. ✅ Configurar banco de dados
7. ✅ Configurar SSL/HTTPS
8. ✅ Iniciar todos os serviços

**Durante a instalação, você precisará informar:**
- 🌐 **Domínio do servidor** (ex: `patrimonio.prefeitura.gov.br`)
- 📧 **Email para certificados SSL**
- 🔐 **Senha forte para o banco de dados**

### Passo 5: Configuração Pós-Instalação

```bash
# Executar configuração pós-instalação
./post-install.sh
```

## 🔧 Instalação Manual (Avançado)

Se preferir instalar manualmente ou tiver problemas com a instalação automática:

### 1. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Dependências

```bash
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release ufw fail2ban htop nano vim tree jq certbot python3-certbot-nginx
```

### 3. Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 4. Instalar Docker

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo usermod -aG docker $USER
sudo systemctl start docker
sudo systemctl enable docker
```

### 5. Configurar Firewall

```bash
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 6. Baixar e Configurar Aplicação

```bash
# Criar diretório da aplicação
sudo mkdir -p /opt/patrimonio
sudo chown $USER:$USER /opt/patrimonio

# Baixar código do repositório GitHub
git clone https://github.com/junielsonfarias/patrimonio.git /opt/patrimonio
cd /opt/patrimonio
```

### 7. Configurar Variáveis de Ambiente

```bash
# Backend
cp backend/env.example backend/.env
nano backend/.env

# Frontend
cp frontend/env.example frontend/.env
nano frontend/.env
```

### 8. Construir e Iniciar

```bash
# Construir imagens
docker compose -f docker-compose.prod.yml build

# Iniciar serviços
docker compose -f docker-compose.prod.yml up -d
```

## 🔍 Verificação da Instalação

### Verificar Status dos Serviços

```bash
# Usar o comando de gerenciamento
patrimonio status

# Ou verificar diretamente
docker compose -f /opt/patrimonio/docker-compose.prod.yml ps
```

### Verificar Logs

```bash
# Ver logs em tempo real
patrimonio logs

# Ver logs específicos
docker compose -f /opt/patrimonio/docker-compose.prod.yml logs backend
docker compose -f /opt/patrimonio/docker-compose.prod.yml logs frontend
```

### Testar Conectividade

```bash
# Testar backend
curl http://localhost:3000/health

# Testar frontend
curl http://localhost:5173

# Testar via domínio (após configurar DNS)
curl https://seu-dominio.com
```

## 🛠️ Comandos de Gerenciamento

Após a instalação, você pode usar os seguintes comandos:

```bash
# Iniciar sistema
patrimonio start

# Parar sistema
patrimonio stop

# Reiniciar sistema
patrimonio restart

# Ver status
patrimonio status

# Ver logs em tempo real
patrimonio logs

# Fazer backup manual
patrimonio backup

# Atualizar sistema
patrimonio update
```

## 🔐 Primeiro Acesso

### Usuários Padrão

Após a instalação, use um dos seguintes usuários para fazer login:

| Role | Email | Senha |
|------|-------|-------|
| Supervisor | supervisor@prefeitura.gov.br | 123456 |
| Administrador | admin@prefeitura.gov.br | 123456 |
| Operador | operador@prefeitura.gov.br | 123456 |
| Consultor | consultor@prefeitura.gov.br | 123456 |

### Passos Iniciais

1. **Acesse a aplicação**: `https://seu-dominio.com`
2. **Faça login** com um dos usuários padrão
3. **Altere as senhas** padrão imediatamente
4. **Configure as secretarias** da prefeitura
5. **Cadastre os funcionários** responsáveis
6. **Importe dados iniciais** se necessário

## 🔒 Configurações de Segurança

### Firewall (UFW)
- ✅ Configurado automaticamente
- ✅ Portas 80 (HTTP) e 443 (HTTPS) abertas
- ✅ SSH protegido
- ✅ Outras portas bloqueadas

### Fail2ban
- ✅ Proteção contra ataques de força bruta
- ✅ Bloqueio automático de IPs suspeitos
- ✅ Configurado para SSH e Nginx

### SSL/TLS
- ✅ Certificado Let's Encrypt automático
- ✅ Renovação automática configurada
- ✅ Redirecionamento HTTP → HTTPS

### Backup
- ✅ Backup automático diário (2h da manhã)
- ✅ Retenção de 7 dias
- ✅ Backup do banco, uploads e configurações

## 📊 Monitoramento

### Health Checks
- ✅ Verificação automática a cada 5 minutos
- ✅ Reinicialização automática em caso de falha
- ✅ Logs de monitoramento em `/opt/patrimonio/logs/`

### Métricas
- ✅ Prometheus configurado (porta 9090)
- ✅ Grafana para dashboards (porta 3001)
- ✅ Logs estruturados

### Alertas
- ✅ Monitoramento de espaço em disco
- ✅ Verificação de conectividade
- ✅ Status dos containers

## 🚨 Solução de Problemas

### Problema: Aplicação não inicia

```bash
# Verificar logs
patrimonio logs

# Verificar status
patrimonio status

# Reiniciar
patrimonio restart
```

### Problema: Erro de permissão

```bash
# Verificar permissões
ls -la /opt/patrimonio

# Corrigir permissões
sudo chown -R patrimonio:patrimonio /opt/patrimonio
```

### Problema: Banco de dados não conecta

```bash
# Verificar status do PostgreSQL
docker compose -f /opt/patrimonio/docker-compose.prod.yml exec postgres pg_isready

# Verificar logs do banco
docker compose -f /opt/patrimonio/docker-compose.prod.yml logs postgres
```

### Problema: Certificado SSL não funciona

```bash
# Renovar certificado
sudo certbot renew --force-renewal

# Verificar certificado
sudo certbot certificates
```

### Problema: Espaço em disco baixo

```bash
# Verificar uso de disco
df -h

# Limpar logs antigos
sudo find /opt/patrimonio/logs -name "*.log" -mtime +30 -delete

# Limpar imagens Docker antigas
docker system prune -a
```

## 📞 Suporte

### Logs Importantes
- **Aplicação**: `/opt/patrimonio/logs/app.log`
- **Nginx**: `/opt/patrimonio/logs/nginx/`
- **Backup**: `/opt/patrimonio/logs/backup.log`
- **Health Check**: `/opt/patrimonio/logs/health-check.log`

### Informações do Sistema
- **Relatório de instalação**: `/opt/patrimonio/installation-report.txt`
- **Configurações**: `/opt/patrimonio/backend/.env`
- **Docker Compose**: `/opt/patrimonio/docker-compose.prod.yml`

### Contato
- **Email**: suporte@sistemapatrimonial.com
- **Documentação**: [GitHub Wiki](https://github.com/junielsonfarias/patrimonio/wiki)
- **Issues**: [GitHub Issues](https://github.com/junielsonfarias/patrimonio/issues)

## 🔄 Atualizações

### Atualização Automática
- ✅ Configurada para domingos às 3h da manhã
- ✅ Backup automático antes da atualização
- ✅ Logs de atualização em `/opt/patrimonio/logs/update.log`

### Atualização Manual
```bash
# Atualizar sistema
patrimonio update

# Ou atualizar manualmente
cd /opt/patrimonio
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## 📚 Recursos Adicionais

### Documentação
- [Manual do Usuário](docs/MANUAL_USUARIO.md)
- [Guia de Administração](docs/GUIA_ADMINISTRACAO.md)
- [API Documentation](docs/API.md)

### Treinamento
- [Vídeos Tutoriais](https://youtube.com/playlist?list=seu-playlist)
- [Webinars](https://sistemapatrimonial.com/webinars)
- [Suporte Técnico](https://sistemapatrimonial.com/suporte)

---

## ✅ Checklist de Instalação

- [ ] Servidor com requisitos mínimos
- [ ] Domínio configurado e DNS apontando
- [ ] Email válido para certificados SSL
- [ ] Script de instalação baixado e executado
- [ ] Informações coletadas (domínio, email, senha)
- [ ] Aplicação iniciada com sucesso
- [ ] Certificado SSL funcionando
- [ ] Primeiro acesso realizado
- [ ] Senhas padrão alteradas
- [ ] Secretarias configuradas
- [ ] Funcionários cadastrados
- [ ] Backup testado
- [ ] Monitoramento funcionando

**🎉 Parabéns! Seu Sistema de Gestão Patrimonial está instalado e funcionando!**

---

*Desenvolvido com ❤️ para prefeituras municipais*
