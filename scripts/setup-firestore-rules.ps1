# setup-firestore-rules.ps1
# Despliega las Firestore Security Rules del repositorio.
#
# Las reglas viven en firestore.rules, versionadas en git (Decision 004).
# Este script NO genera ni borra reglas: solo despliega el archivo que esta
# en el repositorio, para que lo desplegado siempre sea revisable y reversible.

$ErrorActionPreference = "Stop"

$PROJECT_ID = "zeker-505918"
$RULES_FILE = "firestore.rules"

Write-Host "=== Desplegando Firestore Security Rules ===" -ForegroundColor Green

if (-not (Test-Path $RULES_FILE)) {
    Write-Host "ERROR: no se encontro $RULES_FILE en $(Get-Location)." -ForegroundColor Red
    Write-Host "Ejecuta este script desde la raiz del repositorio." -ForegroundColor Red
    exit 1
}

Write-Host "Reglas a desplegar:" -ForegroundColor Yellow
Write-Host "---"
Get-Content $RULES_FILE | Write-Host
Write-Host "---"

gcloud firestore databases update --project=$PROJECT_ID --rules=$RULES_FILE

Write-Host ""
Write-Host "=== COMPLETADO ===" -ForegroundColor Green
Write-Host "Reglas desplegadas desde $RULES_FILE" -ForegroundColor Cyan
Write-Host ""
Write-Host "Recuerda: el acceso directo desde el navegador esta cerrado." -ForegroundColor Yellow
Write-Host "Todo pasa por el backend (Decision 004)." -ForegroundColor Yellow
