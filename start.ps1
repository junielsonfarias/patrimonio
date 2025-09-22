# Sistema de Gestão Patrimonial - Script de Inicialização
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Sistema de Gestão Patrimonial" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Instalando dependências..." -ForegroundColor Yellow
npm run install:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao instalar dependências" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "[2/4] Configurando banco de dados..." -ForegroundColor Yellow
npm run db:setup
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao configurar banco de dados" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "[3/4] Iniciando serviços..." -ForegroundColor Yellow
Write-Host "Backend: http://localhost:3000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione Ctrl+C para parar os serviços" -ForegroundColor Yellow
Write-Host ""

npm run dev
