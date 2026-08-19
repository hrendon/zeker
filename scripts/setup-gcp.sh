#!/bin/bash
# setup-gcp.sh
# Configura GCP: Firestore, KMS, Service Account

set -e

PROJECT_ID="zeker-505918"

echo "=== Configurando GCP Project: $PROJECT_ID ==="

# 1. Set project
echo "Estableciendo proyecto..."
gcloud config set project $PROJECT_ID

# 2. Habilitar APIs
echo "Habilitando APIs..."
gcloud services enable firestore.googleapis.com
gcloud services enable cloudkms.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage-api.googleapis.com

echo "✓ APIs habilitadas"

# 3. Crear Firestore Database (si no existe)
echo "Creando Firestore Database..."
gcloud firestore databases create --location=us-central1 --type=firestore-native 2>/dev/null || echo "✓ Firestore Database ya existe"

sleep 3

# 4. Crear KMS Key Ring
echo "Creando KMS Key Ring..."
gcloud kms keyrings create zeker-keys --location=us-central1 2>/dev/null || echo "✓ KMS Key Ring ya existe"

# 5. Crear KMS Key
echo "Creando KMS Encryption Key..."
gcloud kms keys create zeker-master-key \
  --location=us-central1 \
  --keyring=zeker-keys \
  --purpose=encryption \
  --rotation-period=7776000s 2>/dev/null || echo "✓ KMS Key ya existe"

# 6. Crear Service Account
echo "Creando Service Account..."
gcloud iam service-accounts create zeker-backend \
  --display-name="Zeker Backend Service Account" 2>/dev/null || echo "✓ Service Account ya existe"

SA_EMAIL="zeker-backend@${PROJECT_ID}.iam.gserviceaccount.com"

# 7. Asignar roles
echo "Asignando permisos..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/datastore.user" \
  --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter" \
  --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/logging.logWriter" \
  --quiet 2>/dev/null || true

echo "✓ Permisos asignados"

# 8. Mostrar resumen
echo ""
echo "=== CONFIGURACIÓN COMPLETADA ==="
echo "Project ID: $PROJECT_ID"
echo "Service Account: $SA_EMAIL"
echo "Storage Bucket: ${PROJECT_ID}.appspot.com"
echo "KMS Key: projects/$PROJECT_ID/locations/us-central1/keyRings/zeker-keys/cryptoKeys/zeker-master-key"
echo ""
echo "Siguiente paso: ejecuta setup-firestore-rules.sh"
