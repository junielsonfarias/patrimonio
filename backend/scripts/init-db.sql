-- Script de inicialização do banco de dados
-- Este script é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Criar usuário se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'patrimonio_user') THEN
        CREATE ROLE patrimonio_user WITH LOGIN PASSWORD 'patrimonio_pass';
    END IF;
END
$$;

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE patrimonio_db TO patrimonio_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO patrimonio_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO patrimonio_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO patrimonio_user;

-- Configurar permissões padrão para novas tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO patrimonio_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO patrimonio_user;
