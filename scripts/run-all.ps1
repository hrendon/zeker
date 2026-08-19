# run-all.ps1
# Ejecuta todos los scripts de setup en orden

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  ZEKER - GCP & FIREBASE SETUP                         " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la carpeta correcta
if (!(Test-Path "setup-gcp.ps1")) {
    Write-Host "ERROR: Script debe ejecutarse desde carpeta scripts/" -ForegroundColor Red
    Write-Host "Navega a: cd zeker\scripts" -ForegroundColor Yellow
    exit 1
}

Write-Host "Ejecutando setup en orden..." -ForegroundColor Yellow
Write-Host ""

# Script 1
Write-Host "SCRIPT 1/3: setup-gcp.ps1" -ForegroundColor Cyan
Write-Host "---" -ForegroundColor Gray
.\setup-gcp.ps1
Write-Host ""
Write-Host "OK Script 1 completado" -ForegroundColor Green
Write-Host ""
Read-Host "Presiona ENTER para continuar"
Write-Host ""

# Script 2
Write-Host "SCRIPT 2/3: setup-firestore-rules.ps1" -ForegroundColor Cyan
Write-Host "---" -ForegroundColor Gray
.\setup-firestore-rules.ps1
Write-Host ""
Write-Host "OK Script 2 completado" -ForegroundColor Green
Write-Host ""
Read-Host "Presiona ENTER para continuar"
Write-Host ""

# Script 3
Write-Host "SCRIPT 3/3: get-firebase-config.ps1" -ForegroundColor Cyan
Write-Host "---" -ForegroundColor Gray
.\get-firebase-config.ps1
Write-Host ""
Write-Host "OK Script 3 completado" -ForegroundColor Green
Write-Host ""

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETADO                                      " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Ve a Firebase Console" -ForegroundColor Cyan
Write-Host "2. Copia los valores (apiKey, authDomain, etc.)" -ForegroundColor Cyan
Write-Host "3. Pega en .env.example" -ForegroundColor Cyan
Write-Host "4. Confirma cuando este listo" -ForegroundColor Cyan
Write-Host ""
