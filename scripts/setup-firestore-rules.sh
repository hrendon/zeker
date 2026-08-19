#!/bin/bash
# setup-firestore-rules.sh
# Aplica Firestore Security Rules

set -e

PROJECT_ID="zeker-505918"

echo "=== Configurando Firestore Security Rules ==="

# Crear archivo temporal de reglas
RULES_FILE="firestore.rules"

cat > "$RULES_FILE" << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // MVP: cualquier usuario autenticado puede leer/escribir
    // ANTES DE PRODUCCIÓN: cambiar a reglas granulares de data-minimization.md
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
EOF

echo "Creando archivo de reglas..."

echo "Aplicando reglas a Firestore..."
gcloud firestore databases update --rules=$RULES_FILE

echo "Limpiando archivo temporal..."
rm -f "$RULES_FILE"

echo ""
echo "=== COMPLETADO ==="
echo "✓ Firestore security rules aplicadas"
echo ""
echo "Siguiente paso: ejecuta get-firebase-config.sh"
