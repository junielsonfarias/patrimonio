-- CreateTable
CREATE TABLE "secretarias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME,
    "motivoInativacao" TEXT,
    "secretariaSuccessora" TEXT,
    "responsavel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cargo" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "secretariaId" TEXT NOT NULL,
    "matricula" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "dataAdmissao" DATETIME NOT NULL,
    "dataExoneracao" DATETIME,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "funcionarios_secretariaId_fkey" FOREIGN KEY ("secretariaId") REFERENCES "secretarias" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patrimonios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "codigoSecretaria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "valor" REAL NOT NULL,
    "valorAtual" REAL NOT NULL,
    "dataAquisicao" DATETIME NOT NULL,
    "vidaUtil" INTEGER NOT NULL DEFAULT 10,
    "secretariaId" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "situacao" TEXT NOT NULL DEFAULT 'NOVO',
    "estadoConservacao" TEXT NOT NULL DEFAULT 'BOM',
    "observacoes" TEXT,
    "fotos" TEXT NOT NULL DEFAULT '',
    "qrCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "patrimonios_secretariaId_fkey" FOREIGN KEY ("secretariaId") REFERENCES "secretarias" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "patrimonios_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "funcionarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patrimonioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dataVencimento" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documentos_patrimonioId_fkey" FOREIGN KEY ("patrimonioId") REFERENCES "patrimonios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "manutencoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patrimonioId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" REAL,
    "responsavel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manutencoes_patrimonioId_fkey" FOREIGN KEY ("patrimonioId") REFERENCES "patrimonios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "manutencoes_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transferencias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patrimonioId" TEXT NOT NULL,
    "secretariaOrigemId" TEXT NOT NULL,
    "secretariaDestinoId" TEXT NOT NULL,
    "responsavelTransferenciaId" TEXT NOT NULL,
    "supervisorAprovacaoId" TEXT,
    "motivoTransferencia" TEXT NOT NULL,
    "justificativaSecretariaInativa" TEXT,
    "dataTransferencia" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transferencias_patrimonioId_fkey" FOREIGN KEY ("patrimonioId") REFERENCES "patrimonios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transferencias_secretariaOrigemId_fkey" FOREIGN KEY ("secretariaOrigemId") REFERENCES "secretarias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transferencias_secretariaDestinoId_fkey" FOREIGN KEY ("secretariaDestinoId") REFERENCES "secretarias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transferencias_responsavelTransferenciaId_fkey" FOREIGN KEY ("responsavelTransferenciaId") REFERENCES "funcionarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "log_atividades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "patrimonioId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessaoId" TEXT NOT NULL,
    CONSTRAINT "log_atividades_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "funcionarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "log_atividades_patrimonioId_fkey" FOREIGN KEY ("patrimonioId") REFERENCES "patrimonios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OPERADOR',
    "funcionarioId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "usuarios_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "secretarias_codigo_key" ON "secretarias"("codigo");

-- CreateIndex
CREATE INDEX "secretarias_codigo_idx" ON "secretarias"("codigo");

-- CreateIndex
CREATE INDEX "secretarias_status_idx" ON "secretarias"("status");

-- CreateIndex
CREATE UNIQUE INDEX "funcionarios_cpf_key" ON "funcionarios"("cpf");

-- CreateIndex
CREATE INDEX "funcionarios_cpf_idx" ON "funcionarios"("cpf");

-- CreateIndex
CREATE INDEX "funcionarios_secretariaId_idx" ON "funcionarios"("secretariaId");

-- CreateIndex
CREATE UNIQUE INDEX "patrimonios_numero_key" ON "patrimonios"("numero");

-- CreateIndex
CREATE INDEX "patrimonios_numero_idx" ON "patrimonios"("numero");

-- CreateIndex
CREATE INDEX "patrimonios_codigoSecretaria_idx" ON "patrimonios"("codigoSecretaria");

-- CreateIndex
CREATE INDEX "patrimonios_secretariaId_idx" ON "patrimonios"("secretariaId");

-- CreateIndex
CREATE INDEX "patrimonios_responsavelId_idx" ON "patrimonios"("responsavelId");

-- CreateIndex
CREATE INDEX "patrimonios_status_idx" ON "patrimonios"("status");

-- CreateIndex
CREATE INDEX "patrimonios_categoria_idx" ON "patrimonios"("categoria");

-- CreateIndex
CREATE INDEX "transferencias_status_idx" ON "transferencias"("status");

-- CreateIndex
CREATE INDEX "transferencias_patrimonioId_idx" ON "transferencias"("patrimonioId");

-- CreateIndex
CREATE INDEX "log_atividades_usuarioId_idx" ON "log_atividades"("usuarioId");

-- CreateIndex
CREATE INDEX "log_atividades_timestamp_idx" ON "log_atividades"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_funcionarioId_key" ON "usuarios"("funcionarioId");
