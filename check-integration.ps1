#!/usr/bin/env pwsh
# Frontend Integration Helper Script

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host "  Prompt Agent - Frontend Integration Helper" -ForegroundColor Cyan
Write-Host "===========================================================`n" -ForegroundColor Cyan

# Check if backend is running
Write-Host "Checking backend status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    $health = $response.Content | ConvertFrom-Json
    Write-Host "✓ Backend is running!" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor Gray
    Write-Host "  Framework: $($health.framework)`n" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend is not running" -ForegroundColor Red
    Write-Host "`nTo start the backend:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Gray
    Write-Host "  venv\Scripts\activate" -ForegroundColor Gray
    Write-Host "  python -m api.server`n" -ForegroundColor Gray
    exit 1
}

# Check if .env exists
Write-Host "Checking frontend environment..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists`n" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host "`nCreating .env from template..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ .env created from .env.example" -ForegroundColor Green
        Write-Host "  Please edit .env if needed`n" -ForegroundColor Gray
    } else {
        Write-Host "✗ .env.example not found" -ForegroundColor Red
        Write-Host "`nCreating basic .env..." -ForegroundColor Yellow
        @"
VITE_ADK_BACKEND_URL=http://localhost:8000/api
"@ | Out-File -FilePath ".env" -Encoding utf8
        Write-Host "✓ Basic .env created`n" -ForegroundColor Green
    }
}

# Display next steps
Write-Host "===========================================================`n" -ForegroundColor Cyan
Write-Host "Setup Status: Ready for Integration!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Review services/adkService.ts (new ADK integration)" -ForegroundColor Gray
Write-Host "  2. Update component imports to use adkService" -ForegroundColor Gray
Write-Host "  3. Start frontend: npm run dev" -ForegroundColor Gray
Write-Host "  4. Test each agent workflow`n" -ForegroundColor Gray

Write-Host "Quick Test:" -ForegroundColor Yellow
Write-Host "  curl -X POST http://localhost:8000/api/agents/create ``" -ForegroundColor Gray
Write-Host "    -H 'Content-Type: application/json' ``" -ForegroundColor Gray
Write-Host "    -d '{\"goal\":\"Test\",\"audience\":\"\",\"constraints\":\"\"}'`n" -ForegroundColor Gray

Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - Frontend Integration Guide: FRONTEND_INTEGRATION.md" -ForegroundColor Gray
Write-Host "  - Backend API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "  - Backend README: backend/README.md`n" -ForegroundColor Gray

Write-Host "===========================================================" -ForegroundColor Cyan
