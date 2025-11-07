# Script para iniciar SAME Email Server e Scheduler
# Use: .\start-email.ps1

$FunctionsPath = "C:\Users\kevin\OneDrive\Documentos\GitHub\same-project-firebase\functions"

Write-Host "🚀 Iniciando SAME Email System..." -ForegroundColor Green
Write-Host ""

# Mudar para pasta functions
Set-Location $FunctionsPath

# Verificar se firebase-key.json existe
if (-not (Test-Path "firebase-key.json")) {
    Write-Host "⚠️  AVISO: firebase-key.json não encontrado!" -ForegroundColor Yellow
    Write-Host "📖 Leia COMO_OBTER_FIREBASE_KEY.md para instruções" -ForegroundColor Yellow
    Write-Host ""
}

# Verificar se .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ ERRO: .env.local não encontrado!" -ForegroundColor Red
    Write-Host "Configure suas credenciais de email primeiro" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configurações encontradas" -ForegroundColor Green
Write-Host ""

# Terminal 1: Servidor
Write-Host "1️⃣  Iniciando Express Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FunctionsPath'; node server.js" -WindowStyle Normal

# Aguardar servidor iniciar
Start-Sleep -Seconds 3

# Terminal 2: Agendador
Write-Host "2️⃣  Iniciando Node-Cron Scheduler..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FunctionsPath'; npm run cron" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Sistema iniciado!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Servidor:    http://localhost:3000" -ForegroundColor White
Write-Host "📊 Endpoints:   GET /health, POST /monitor-products" -ForegroundColor White
Write-Host "⏰ Agendador:   Monitora a cada 1 hora" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Para testar, em outro terminal execute:" -ForegroundColor Cyan
Write-Host "   cd '$FunctionsPath'" -ForegroundColor Cyan
Write-Host "   node test.js" -ForegroundColor Cyan
