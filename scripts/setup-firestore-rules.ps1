# setup-firestore-rules.ps1
# Aplica Firestore Security Rules

$PROJECT_ID = "zeker-505918"

Write-Host "=== Configurando Firestore Security Rules ===" -ForegroundColor Green

# Crear archivo temporal de reglas
$RULES_FILE = "firestore.rules"

$RULES_CONTENT = @"
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // MVP: cualquier usuario autenticado puede leer/escribir
    // ANTES DE PRODUCCION: cambiar a reglas granulares de data-minimization.md
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
"@

Write-Host "Creando archivo de reglas..." -ForegroundColor Yellow
Set-Content -Path $RULES_FILE -Value $RULES_CONTENT -Encoding UTF8

Write-Host "Aplicando reglas a Firestore..." -ForegroundColor Yellow
gcloud firestore databases update --rules=$RULES_FILE

Write-Host "Limpiando archivo temporal..." -ForegroundColor Yellow
Remove-Item $RULES_FILE -Force 2>$null

Write-Host ""
Write-Host "=== COMPLETADO ===" -ForegroundColor Green
Write-Host "Firestore security rules aplicadas" -ForegroundColor Cyan
Write-Host ""
Write-Host "Siguiente paso: ejecuta get-firebase-config.ps1" -ForegroundColor Yellow
