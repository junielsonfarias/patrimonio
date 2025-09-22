# 🚀 Instalação Rápida - Sistema de Gestão Patrimonial

## 📋 Para Usuários Sem Conhecimento Técnico

### ⚡ Instalação em 3 Passos

1. **Conecte ao seu servidor VPS**
2. **Execute o comando abaixo**
3. **Siga as instruções na tela**

```bash
# Baixar e executar o instalador
wget https://raw.githubusercontent.com/seu-usuario/sistema-gestao-patrimonial/main/instalar-facil.sh
chmod +x instalar-facil.sh
./instalar-facil.sh
```

### 📝 Informações que você precisará fornecer:

- 🏛️ **Nome da sua prefeitura**
- 🌐 **Domínio do servidor** (ex: `patrimonio.prefeitura.gov.br`)
- 📧 **Seu email** (para certificados de segurança)
- 🔐 **Senha forte** para o banco de dados

### ⏱️ Tempo de instalação: ~30 minutos

---

## 🔧 Para Usuários Técnicos

### Instalação Completa

```bash
# Baixar e executar o instalador completo
wget https://raw.githubusercontent.com/seu-usuario/sistema-gestao-patrimonial/main/install.sh
chmod +x install.sh
./install.sh
```

### Verificar Dependências

```bash
# Verificar se o servidor está pronto
wget https://raw.githubusercontent.com/seu-usuario/sistema-gestao-patrimonial/main/check-dependencies.sh
chmod +x check-dependencies.sh
./check-dependencies.sh
```

---

## 📋 Requisitos do Servidor

### Mínimos
- **Sistema**: Ubuntu 20.04+ ou Debian 11+
- **RAM**: 2GB
- **Disco**: 10GB livres
- **CPU**: 2 cores

### Recomendados
- **RAM**: 4GB+
- **Disco**: 20GB+ livres
- **CPU**: 4 cores+

---

## 🌐 Configuração de Domínio

### 1. Configure o DNS
Após a instalação, configure o DNS do seu domínio para apontar para o IP do servidor:

```
A    patrimonio.prefeitura.gov.br    →    IP_DO_SERVIDOR
```

### 2. Aguarde a propagação
Pode levar até 24 horas para o DNS propagar completamente.

---

## 🔑 Primeiro Acesso

### Usuários Padrão

| Função | Email | Senha |
|--------|-------|-------|
| Supervisor | supervisor@prefeitura.gov.br | 123456 |
| Administrador | admin@prefeitura.gov.br | 123456 |
| Operador | operador@prefeitura.gov.br | 123456 |
| Consultor | consultor@prefeitura.gov.br | 123456 |

### ⚠️ Importante
**Altere as senhas padrão imediatamente após o primeiro acesso!**

---

## 🛠️ Comandos de Gerenciamento

```bash
# Iniciar sistema
patrimonio start

# Parar sistema
patrimonio stop

# Reiniciar sistema
patrimonio restart

# Ver status
patrimonio status

# Ver logs
patrimonio logs

# Fazer backup
patrimonio backup

# Atualizar sistema
patrimonio update
```

---

## 🔒 Segurança Configurada

- ✅ **Firewall** (UFW) configurado
- ✅ **Fail2ban** para proteção contra ataques
- ✅ **SSL/TLS** com Let's Encrypt
- ✅ **Backup automático** diário
- ✅ **Monitoramento** contínuo

---

## 📊 Monitoramento

### Logs
- **Aplicação**: `/opt/patrimonio/logs/app.log`
- **Nginx**: `/opt/patrimonio/logs/nginx/`
- **Backup**: `/opt/patrimonio/logs/backup.log`
- **Health Check**: `/opt/patrimonio/logs/health-check.log`

### Métricas
- **Prometheus**: `https://seu-dominio.com:9090`
- **Grafana**: `https://seu-dominio.com:3001`

---

## 🚨 Solução de Problemas

### Sistema não inicia
```bash
# Verificar status
patrimonio status

# Ver logs
patrimonio logs

# Reiniciar
patrimonio restart
```

### Problema de permissão
```bash
# Corrigir permissões
sudo chown -R patrimonio:patrimonio /opt/patrimonio
```

### Certificado SSL não funciona
```bash
# Renovar certificado
sudo certbot renew --force-renewal
```

### Espaço em disco baixo
```bash
# Limpar logs antigos
sudo find /opt/patrimonio/logs -name "*.log" -mtime +30 -delete

# Limpar imagens Docker antigas
docker system prune -a
```

---

## 📞 Suporte

### Documentação Completa
- [Guia de Instalação Detalhado](INSTALACAO.md)
- [Manual do Usuário](docs/MANUAL_USUARIO.md)
- [Guia de Administração](docs/GUIA_ADMINISTRACAO.md)

### Contato
- **Email**: suporte@sistemapatrimonial.com
- **GitHub**: [Issues](https://github.com/seu-usuario/sistema-gestao-patrimonial/issues)

---

## ✅ Checklist Pós-Instalação

- [ ] Sistema instalado e funcionando
- [ ] Domínio configurado e DNS propagado
- [ ] Certificado SSL funcionando
- [ ] Primeiro acesso realizado
- [ ] Senhas padrão alteradas
- [ ] Secretarias configuradas
- [ ] Funcionários cadastrados
- [ ] Backup testado
- [ ] Monitoramento funcionando

---

**🎉 Parabéns! Seu Sistema de Gestão Patrimonial está pronto para uso!**

*Desenvolvido com ❤️ para prefeituras municipais*
