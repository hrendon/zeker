#!/bin/bash
# get-firebase-config.sh
# Genera template .env con valores de Firebase

PROJECT_ID="zeker-505918"

echo "=== Obteniendo Firebase Configuration ==="

# Crear template .env
cat > "../.env.example" << EOF
# ===================================
# BACKEND Configuration (.env para backend/)
# ===================================

# GCP Configuration
GCP_PROJECT_ID=$PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json
GCP_KMS_KEY_ID=projects/$PROJECT_ID/locations/us-central1/keyRings/zeker-keys/cryptoKeys/zeker-master-key

# Firebase Configuration
# OBTÉN ESTOS VALORES DE: https://console.firebase.google.com/project/$PROJECT_ID/settings/general
# En "Firebase SDK snippet", copia:
FIREBASE_PROJECT_ID=$PROJECT_ID
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Server Configuration
PORT=3001
NODE_ENV=development

# ===================================
# FRONTEND Configuration (.env.local para frontend/)
# ===================================

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
EOF

echo "✓ Creando .env.example en carpeta raíz..."

echo ""
echo "=== INSTRUCCIONES FINALES ==="
echo ""
echo "1. Abre Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID/settings/general"
echo ""
echo "2. Scroll hacia abajo hasta 'Firebase SDK snippet'"
echo ""
echo "3. Copia ESTOS valores:"
echo "   - apiKey → NEXT_PUBLIC_FIREBASE_API_KEY"
echo "   - authDomain → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "   - projectId → NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "   - storageBucket → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "   - messagingSenderId → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "   - appId → NEXT_PUBLIC_FIREBASE_APP_ID"
echo ""
echo "4. Pega los valores en:"
echo "   - backend/.env (para variables servidor)"
echo "   - frontend/.env.local (para variables cliente)"
echo ""
echo "5. Para autenticación Firebase en backend, también necesitas:"
echo "   - Ve a: https://console.firebase.google.com/project/$PROJECT_ID/settings/serviceaccounts/adminsdk"
echo "   - Genera nueva key privada (JSON)"
echo "   - Copia los valores: private_key, client_email"
echo ""
echo "=== TEMPLATE GENERADO ==="
echo "✓ .env.example creado en raíz de proyecto"
echo ""
echo "SIGUIENTE PASO:"
echo "Copia los valores de Firebase Console a tus .env files"
echo "Luego me das confirmación y genero backend + frontend"
