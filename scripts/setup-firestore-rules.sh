#!/bin/bash
# setup-firestore-rules.sh
# Despliega las Firestore Security Rules del repositorio.
#
# Las reglas viven en firestore.rules, versionadas en git (Decisión 004).
# Este script NO genera ni borra reglas: solo despliega el archivo que está
# en el repositorio, para que lo desplegado siempre sea revisable y reversible.

set -e

PROJECT_ID="zeker-505918"
RULES_FILE="firestore.rules"

echo "=== Desplegando Firestore Security Rules ==="

if [ ! -f "$RULES_FILE" ]; then
  echo "ERROR: no se encontró $RULES_FILE en $(pwd)."
  echo "Ejecuta este script desde la raíz del repositorio."
  exit 1
fi

echo "Reglas a desplegar:"
echo "---"
cat "$RULES_FILE"
echo "---"

gcloud firestore databases update \
  --project="$PROJECT_ID" \
  --rules="$RULES_FILE"

echo ""
echo "=== COMPLETADO ==="
echo "✓ Reglas desplegadas desde $RULES_FILE"
echo ""
echo "Recuerda: el acceso directo desde el navegador está cerrado."
echo "Todo pasa por el backend (Decisión 004)."
