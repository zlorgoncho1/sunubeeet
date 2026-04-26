#!/usr/bin/env pwsh

# Script de démarrage: Système d'Alerte Bët
# Usage: .\start.ps1

Write-Host "`n" + "="*70 -ForegroundColor Cyan
Write-Host "🚀 DÉMARRAGE SYSTÈME D'ALERTE BËT" -ForegroundColor Cyan
Write-Host "="*70 + "`n" -ForegroundColor Cyan

$WorkspacePath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $WorkspacePath

Write-Host "📂 Workspace: $WorkspacePath`n" -ForegroundColor Green

# Vérifier les dépendances
Write-Host "✓ Vérification des dépendances..." -ForegroundColor Green
try {
    python -c "import fastapi, requests" -ErrorAction Stop
    Write-Host "✓ FastAPI & Requests OK`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Dépendances manquantes" -ForegroundColor Red
    Write-Host "   pip install fastapi uvicorn requests" -ForegroundColor Yellow
    exit 1
}

# Libérer les ports s'ils sont en utilisation
Write-Host "🧹 Nettoyage des ports..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { 
    taskkill /PID $_.OwningProcess /F 2>$null 
}
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { 
    taskkill /PID $_.OwningProcess /F 2>$null 
}
Write-Host ""

# Lancer l'API
Write-Host "1️⃣  Démarrage API FastAPI (port 5000)..." -ForegroundColor Green
$apiProcess = Start-Process -FilePath python -ArgumentList "-m ml.api.app" -PassThru
Write-Host "   ✓ Processus lancé (PID: $($apiProcess.Id))`n" -ForegroundColor Green

# Lancer le Dashboard
Write-Host "2️⃣  Démarrage serveur Dashboard (port 8000)..." -ForegroundColor Green
$dashboardProcess = Start-Process -FilePath python -ArgumentList "serve_interface.py" -PassThru
Write-Host "   ✓ Processus lancé (PID: $($dashboardProcess.Id))`n" -ForegroundColor Green

# Afficher l'info
Write-Host "="*70 -ForegroundColor Cyan
Write-Host "✅ SYSTÈME PRÊT!" -ForegroundColor Green
Write-Host "="*70 + "`n" -ForegroundColor Cyan

$info = @"
🔗 ENDPOINTS:
   • API Bët:      http://localhost:5000/
   • Dashboard:    http://localhost:8000/dashboard.html
   • Health:       http://localhost:5000/health

📊 FLUX:
   1. Le Dashboard s'ouvre automatiquement
   2. Remplissez le formulaire d'alerte
   3. Cliquez "Envoyer l'Alerte"
   4. Résultat immédiat: référence + status

🛑 ARRÊT:
   Tapez 'exit' ou appuyez sur Ctrl+C

📚 DOCUMENTATION:
   • Frontend: http://localhost:8000/dashboard.html
   • API Docs: http://localhost:5000/docs
   • Integration: ./LARAVEL_INTEGRATION.md

"@
Write-Host $info

# Monitorer les processus
Write-Host "="*70 + "`n" -ForegroundColor Cyan
Write-Host "⏳ Attente... (Ctrl+C pour arrêter)`n" -ForegroundColor Yellow

try {
    while ($true) {
        if ($apiProcess.HasExited) {
            Write-Host "⚠️  API s'est arrêtée" -ForegroundColor Yellow
        }
        if ($dashboardProcess.HasExited) {
            Write-Host "⚠️  Dashboard s'est arrêté" -ForegroundColor Yellow
        }
        Start-Sleep -Seconds 2
    }
} 
catch [System.Management.Automation.PipelineStoppedException] {
    Write-Host "`n`n🛑 Arrêt du système..." -ForegroundColor Yellow
} 
finally {
    Write-Host "`nTerminaison des processus..." -ForegroundColor Yellow
    
    try {
        $apiProcess | Stop-Process -Force -ErrorAction SilentlyContinue
        $dashboardProcess | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Tous les services arrêtés`n" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Erreur lors de l'arrêt" -ForegroundColor Yellow
    }
}
