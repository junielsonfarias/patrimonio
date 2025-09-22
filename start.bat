@echo off
echo ========================================
echo  Sistema de Gestao Patrimonial
echo ========================================
echo.

echo [1/4] Instalando dependencias...
call npm run install:all
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)

echo.
echo [2/4] Configurando banco de dados...
call npm run db:setup
if %errorlevel% neq 0 (
    echo ERRO: Falha ao configurar banco de dados
    pause
    exit /b 1
)

echo.
echo [3/4] Iniciando servicos...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Pressione Ctrl+C para parar os servicos
echo.

call npm run dev

pause
