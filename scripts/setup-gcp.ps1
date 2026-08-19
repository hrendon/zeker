# setup-gcp.ps1
# Configura GCP: Firestore, KMS, Service Account

$PROJECT_ID = "zeker-505918"

Write-Host "=== Configurando GCP Project: $PROJECT_ID ===" -ForegroundColor Green

# 1. Set project
Write-Host "Estableciendo proyecto..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# 2. Habilitar APIs
Write-Host "Habilitando APIs..." -ForegroundColor Yellow
gcloud services enable firestore.googleapis.com
gcloud services enable cloudkms.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage-api.googleapis.com

Write-Host "APIs habilitadas" -ForegroundColor Green

# 3. Crear Firestore Database (si no existe)
Write-Host "Creando Firestore Database..." -ForegroundColor Yellow
try {
    gcloud firestore databases create --location=us-central1 --type=firestore-native 2>$null
    Write-Host "Firestore Database creada" -ForegroundColor Green
} catch {
    Write-Host "Firestore Database ya existe (OK)" -ForegroundColor Green
}

Start-Sleep -Seconds 3

# 4. Crear KMS Key Ring
Write-Host "Creando KMS Key Ring..." -ForegroundColor Yellow
try {
    gcloud kms keyrings create zeker-keys --location=us-central1 2>$null
    Write-Host "KMS Key Ring creado" -ForegroundColor Green
} catch {
    Write-Host "KMS Key Ring ya existe (OK)" -ForegroundColor Green
}

# 5. Crear KMS Key
Write-Host "Creando KMS Encryption Key..." -ForegroundColor Yellow
try {
    gcloud kms keys create zeker-master-key `
      --location=us-central1 `
      --keyring=zeker-keys `
      --purpose=encryption `
      --rotation-period=7776000s 2>$null
    Write-Host "KMS Key creada" -ForegroundColor Green
} catch {
    Write-Host "KMS Key ya existe (OK)" -ForegroundColor Green
}

# 6. Crear Service Account
Write-Host "Creando Service Account..." -ForegroundColor Yellow
try {
    gcloud iam service-accounts create zeker-backend `
      --display-name="Zeker Backend Service Account" 2>$null
    Write-Host "Service Account creado" -ForegroundColor Green
} catch {
    Write-Host "Service Account ya existe (OK)" -ForegroundColor Green
}

$SA_EMAIL = "zeker-backend@${PROJECT_ID}.iam.gserviceaccount.com"

# 7. Asignar roles
Write-Host "Asignando permisos..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/datastore.user" `
  --quiet 2>$null

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter" `
  --quiet 2>$null

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$SA_EMAIL" `
  --role="roles/logging.logWriter" `
  --quiet 2>$null

Write-Host "Permisos asignados" -ForegroundColor Green

# 8. Mostrar resumen
Write-Host ""
Write-Host "=== CONFIGURACION COMPLETADA ===" -ForegroundColor Green
Write-Host "Project ID: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "Service Account: $SA_EMAIL" -ForegroundColor Cyan
Write-Host "Storage Bucket: ${PROJECT_ID}.appspot.com" -ForegroundColor Cyan
Write-Host "KMS Key: projects/$PROJECT_ID/locations/us-central1/keyRings/zeker-keys/cryptoKeys/zeker-master-key" -ForegroundColor Cyan
Write-Host ""
Write-Host "Siguiente paso: ejecuta setup-firestore-rules.ps1" -ForegroundColor Yellow
