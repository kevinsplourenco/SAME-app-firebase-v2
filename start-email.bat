@echo off
REM Script para iniciar SAME Email Server e Scheduler
REM Use: start-email.bat

cd /d C:\Users\kevin\OneDrive\Documentos\GitHub\same-project-firebase\functions

REM Iniciar servidor em uma nova janela
start "SAME Email Server" cmd /k "node server.js"

REM Aguardar servidor iniciar
timeout /t 2 /nobreak

REM Iniciar agendador em outra janela
start "SAME Email Scheduler" cmd /k "npm run cron"

REM Abrir localhost para debug
timeout /t 1 /nobreak
start http://localhost:3000/health

echo.
echo ✅ Servidor iniciado em http://localhost:3000
echo 📊 Agendador rodando (monitora a cada 1 hora)
echo.
pause
