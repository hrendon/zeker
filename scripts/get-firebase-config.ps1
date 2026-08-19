# get-firebase-config.ps1
# Genera template .env con valores de Firebase

$PROJECT_ID = "zeker-505918"

Write-Host "=== Obteniendo Firebase Configuration ===" -ForegroundColor Green

# Crear template .env
$ENV_TEMPLATE = @"
# GCP Configuration
GCP_PROJECT_ID=$PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json
GCP_KMS_KEY_ID=projects/$PROJECT_ID/locations/us-central1/keyRings/zeker-keys/cryptoKeys/zeker-master-key

# Firebase Configuration
# OBTÉN ESTOS VALORES DE: https://console.firebase.google.com/project/$PROJECT_ID/settings/general
# En Firebase SDK snippet, copia:
FIREBASE_PROJECT_ID=$PROJECT_ID
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Server Configuration
PORT=3001
NODE_ENV=development

# Firebase Client Configuration
# OBTÉN ESTOS DE: https://console.firebase.google.com/project/$PROJECT_ID/settings/general
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001
"@

Write-Host "Creando .env.example..." -ForegroundColor Yellow
Set-Content -Path "..\.env.example" -Value $ENV_TEMPLATE -Encoding UTF8

Write-Host ""
Write-Host "=== INSTRUCCIONES FINALES ===" -ForegroundColor Green

Write-Host ""
Write-Host "1. Abre Firebase Console:" -ForegroundColor Yellow
Write-Host "   https://console.firebase.google.com/project/$PROJECT_ID/settings/general" -ForegroundColor Cyan

Write-Host ""
Write-Host "2. Scroll hacia abajo hasta Firebase SDK snippet" -ForegroundColor Yellow

Write-Host ""
Write-Host "3. Copia ESTOS valores:" -ForegroundColor Yellow
Write-Host "   - apiKey" -ForegroundColor Cyan
Write-Host "   - authDomain" -ForegroundColor Cyan
Write-Host "   - projectId" -ForegroundColor Cyan
Write-Host "   - storageBucket" -ForegroundColor Cyan
Write-Host "   - messagingSenderId" -ForegroundColor Cyan
Write-Host "   - appId" -ForegroundColor Cyan

Write-Host ""
Write-Host "4. Pega los valores en .env.example" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== TEMPLATE GENERADO ===" -ForegroundColor Green
Write-Host ".env.example creado en raiz de proyecto" -ForegroundColor Cyan

Write-Host ""
Write-Host "SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host "Copia los valores de Firebase Console a .env.example" -ForegroundColor Cyan
